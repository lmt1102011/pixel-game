const fs = require("fs");
const path = require("path");

const { chromium } = require("playwright-core");

const repoRoot = path.resolve(__dirname, "..");
const exportedDir = path.resolve(repoRoot, "assets", "exported");
const defaultSheetsDir = path.resolve(repoRoot, "assets", "exported-sheets");

function usage() {
  return [
    "Usage: node tools/apply-asset-sheets.js [options]",
    "",
    "Slices edited sprite sheets back into assets/exported frame PNGs.",
    "Run tools/make-asset-sheets.js first, edit the generated PNG sheets, then apply them.",
    "",
    "Options:",
    "  --sheets <dir>          Sheet directory; default assets/exported-sheets",
    "  --out <dir>             Output directory; default assets/exported",
    "  --path <text>           Apply only sheets or source paths containing text",
    "  --group <text>          Apply only source groups containing text",
    "  --dry-run               Print what would be applied without writing files",
    "  --help                  Show this help"
  ].join("\n");
}

function parseArgs(argv) {
  const options = {
    sheets: defaultSheetsDir,
    out: exportedDir,
    dryRun: false
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg.startsWith("--")) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) options[key] = "true";
      else {
        options[key] = next;
        i++;
      }
    }
  }
  options.sheets = path.resolve(repoRoot, String(options.sheets || defaultSheetsDir));
  options.out = path.resolve(repoRoot, String(options.out || exportedDir));
  return options;
}

function assertInsideRepo(targetPath) {
  const relative = path.relative(repoRoot, targetPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to use path outside repo: ${targetPath}`);
  }
}

function assertInsideDir(baseDir, targetPath) {
  const relative = path.relative(baseDir, targetPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside output directory: ${targetPath}`);
  }
}

function chromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter(Boolean);
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error("Chrome/Edge executable not found. Set CHROME_PATH to apply sheets.");
  return found;
}

function decodeDataUrl(dataUrl) {
  const match = /^data:image\/png;base64,(.+)$/i.exec(String(dataUrl || ""));
  if (!match) throw new Error("Invalid PNG data URL");
  return Buffer.from(match[1], "base64");
}

function normalizeSourcePath(value) {
  const relative = String(value || "")
    .replace(/\\/g, "/")
    .replace(/^assets\/exported\//i, "")
    .replace(/^\/+/, "");
  if (!relative || path.isAbsolute(relative) || relative.includes(":") || relative.split("/").includes("..")) {
    throw new Error(`Unsafe exported asset path: ${value}`);
  }
  return relative;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function buildExportManifestMap() {
  const manifestPath = path.join(exportedDir, "asset-manifest.json");
  if (!fs.existsSync(manifestPath)) return new Map();
  const manifest = readJson(manifestPath);
  return new Map((manifest.files || []).map((file) => [normalizeSourcePath(file.path), file]));
}

function sheetMatches(sheet, options) {
  const haystack = [
    sheet.path,
    sheet.sourceGroup,
    ...(sheet.sources || []),
    ...(sheet.placements || []).map((placement) => placement.path)
  ].join("\n").toLowerCase();
  if (options.path && !haystack.includes(String(options.path).toLowerCase())) return false;
  if (options.group && !String(sheet.sourceGroup || "").toLowerCase().includes(String(options.group).toLowerCase())) {
    return false;
  }
  return true;
}

function placementsForSheet(sheet, manifestMap) {
  if (Array.isArray(sheet.placements) && sheet.placements.length) {
    return sheet.placements.map((placement) => ({
      path: normalizeSourcePath(placement.path),
      width: Math.max(1, Number(placement.width) || 1),
      height: Math.max(1, Number(placement.height) || 1),
      x: Math.max(0, Number(placement.x) || 0),
      y: Math.max(0, Number(placement.y) || 0),
      drawWidth: Math.max(1, Number(placement.drawWidth) || Number(placement.width) || 1),
      drawHeight: Math.max(1, Number(placement.drawHeight) || Number(placement.height) || 1)
    }));
  }

  if (!Array.isArray(sheet.sources) || !sheet.sources.length) {
    throw new Error(`${sheet.path} has no placement data. Rebuild sheets with tools/make-asset-sheets.js.`);
  }

  const columns = Math.max(1, Number(sheet.columns) || Math.ceil(Math.sqrt(sheet.sources.length)));
  const padding = Math.max(0, Number(sheet.padding) || 0);
  const scale = Math.max(0.25, Number(sheet.scale) || 1);
  const labelHeight = Math.max(0, Number(sheet.labelHeight) || (sheet.labels ? 18 : 0));
  const sourceFiles = sheet.sources.map((source) => {
    const relative = normalizeSourcePath(source);
    const file = manifestMap.get(relative);
    if (!file) throw new Error(`Missing exported manifest entry for ${relative}`);
    return {
      path: relative,
      width: Math.max(1, Number(file.width) || 1),
      height: Math.max(1, Number(file.height) || 1)
    };
  });
  const maxW = Math.max(1, ...sourceFiles.map((file) => file.width));
  const maxH = Math.max(1, ...sourceFiles.map((file) => file.height));
  const cellWidth = Math.max(1, Number(sheet.cellWidth) || Math.ceil(maxW * scale) + padding * 2);
  const cellHeight = Math.max(1, Number(sheet.cellHeight) || Math.ceil(maxH * scale) + padding * 2 + labelHeight);

  return sourceFiles.map((file, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const drawWidth = Math.max(1, Math.round(file.width * scale));
    const drawHeight = Math.max(1, Math.round(file.height * scale));
    return {
      path: file.path,
      width: file.width,
      height: file.height,
      x: col * cellWidth + padding + Math.floor((cellWidth - padding * 2 - drawWidth) / 2),
      y: row * cellHeight + padding + Math.floor((cellHeight - padding * 2 - labelHeight - drawHeight) / 2),
      drawWidth,
      drawHeight
    };
  });
}

async function sliceSheet(page, sheetPath, placements) {
  const dataUrl = `data:image/png;base64,${fs.readFileSync(sheetPath).toString("base64")}`;
  return page.evaluate(async ({ dataUrl, placements }) => {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load sheet image"));
      img.src = dataUrl;
    });
    return placements.map((placement) => {
      const canvas = document.createElement("canvas");
      canvas.width = placement.width;
      canvas.height = placement.height;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        image,
        placement.x,
        placement.y,
        placement.drawWidth,
        placement.drawHeight,
        0,
        0,
        placement.width,
        placement.height
      );
      return {
        path: placement.path,
        dataUrl: canvas.toDataURL("image/png")
      };
    });
  }, { dataUrl, placements });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  assertInsideRepo(options.sheets);
  assertInsideRepo(options.out);
  const sheetManifestPath = path.join(options.sheets, "asset-sheets.json");
  if (!fs.existsSync(sheetManifestPath)) {
    throw new Error(`Missing sheet manifest: ${path.relative(repoRoot, sheetManifestPath)}`);
  }

  const sheetManifest = readJson(sheetManifestPath);
  const manifestMap = buildExportManifestMap();
  const sheets = (sheetManifest.files || []).filter((sheet) => sheetMatches(sheet, options));
  if (!sheets.length) throw new Error("No sheets matched the selected filters.");

  let frameCount = 0;
  const plan = sheets.map((sheet) => {
    const placements = placementsForSheet(sheet, manifestMap);
    frameCount += placements.length;
    return { sheet, placements };
  });

  if (options.dryRun) {
    console.log(`Would apply ${frameCount} frame(s) from ${plan.length} sheet(s) to ${path.relative(repoRoot, options.out)}.`);
    for (const item of plan) {
      console.log(`- ${item.sheet.path}: ${item.placements.length} frame(s)`);
    }
    return;
  }

  fs.mkdirSync(options.out, { recursive: true });
  const browser = await chromium.launch({ executablePath: chromeExecutable(), headless: true });
  const page = await browser.newPage();
  let written = 0;

  try {
    for (const item of plan) {
      const sheetPath = path.join(options.sheets, normalizeSourcePath(item.sheet.path));
      assertInsideDir(options.sheets, sheetPath);
      if (!fs.existsSync(sheetPath)) throw new Error(`Missing sheet image: ${path.relative(repoRoot, sheetPath)}`);
      const frames = await sliceSheet(page, sheetPath, item.placements);
      for (const frame of frames) {
        const targetPath = path.join(options.out, normalizeSourcePath(frame.path));
        assertInsideDir(options.out, targetPath);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, decodeDataUrl(frame.dataUrl));
        written++;
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`Applied ${written} frame(s) from ${plan.length} sheet(s) to ${path.relative(repoRoot, options.out)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
