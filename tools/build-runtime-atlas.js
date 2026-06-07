const fs = require("fs");
const path = require("path");

const { chromium } = require("playwright-core");

const repoRoot = path.resolve(__dirname, "..");
const exportedDir = path.join(repoRoot, "assets", "exported");
const manifestPath = path.join(exportedDir, "asset-manifest.json");
const defaultOutDir = path.join(repoRoot, "assets", "exported-atlas");

function usage() {
  return [
    "Usage: node tools/build-runtime-atlas.js [options]",
    "",
    "Builds runtime sprite atlases from assets/exported frame PNGs.",
    "",
    "Options:",
    "  --out <dir>          Output directory; default assets/exported-atlas",
    "  --max-size <n>       Max sheet width/height target; default 2048",
    "  --padding <n>        Transparent padding around frames; default 1",
    "  --clean              Remove output directory before writing",
    "  --help               Show this help"
  ].join("\n");
}

function parseArgs(argv) {
  const options = {
    out: defaultOutDir,
    maxSize: 2048,
    padding: 1,
    clean: false
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--clean") options.clean = true;
    else if (arg === "--out") options.out = argv[++i] || options.out;
    else if (arg === "--max-size") options.maxSize = Number(argv[++i] || options.maxSize) || options.maxSize;
    else if (arg === "--padding") options.padding = Number(argv[++i] || options.padding) || options.padding;
  }
  options.out = path.resolve(repoRoot, String(options.out || defaultOutDir));
  options.maxSize = Math.max(512, Math.min(4096, Math.round(options.maxSize || 2048)));
  options.padding = Math.max(0, Math.min(16, Math.round(options.padding || 0)));
  return options;
}

function assertInsideRepo(targetPath) {
  const relative = path.relative(repoRoot, targetPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside repo: ${targetPath}`);
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
  if (!found) throw new Error("Chrome/Edge executable not found. Set CHROME_PATH to build runtime atlas.");
  return found;
}

function normalizeSlash(value) {
  return String(value || "").replace(/\\/g, "/").replace(/^\/+/, "");
}

function safeSlug(value) {
  return normalizeSlash(value)
    .replace(/[^a-z0-9/_-]+/gi, "-")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "");
}

function decodeDataUrl(dataUrl) {
  const match = /^data:image\/png;base64,(.+)$/i.exec(String(dataUrl || ""));
  if (!match) throw new Error("Invalid PNG data URL");
  return Buffer.from(match[1], "base64");
}

function groupKeyFor(file) {
  return path.dirname(normalizeSlash(file.path));
}

function sortFrames(a, b) {
  const metaA = a.meta || {};
  const metaB = b.meta || {};
  const stateOrder = { idle: 0, walk: 1, run: 1, attack: 2, skill: 3, ultimate: 4, death: 5, open: 6, grow: 7, active: 8 };
  const stateDelta = (stateOrder[metaA.state] ?? 99) - (stateOrder[metaB.state] ?? 99);
  if (stateDelta) return stateDelta;
  const frameDelta = (Number(metaA.frame) || 0) - (Number(metaB.frame) || 0);
  if (frameDelta) return frameDelta;
  return String(a.path || "").localeCompare(String(b.path || ""));
}

async function buildSheet(page, entries, options) {
  return page.evaluate(async ({ entries, maxSize, padding }) => {
    const loadImage = (entry) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ ...entry, image });
      image.onerror = () => reject(new Error(`Failed to load ${entry.path}`));
      image.src = entry.dataUrl;
    });
    const loaded = [];
    for (const entry of entries) loaded.push(await loadImage(entry));
    const maxW = Math.max(1, ...loaded.map((entry) => entry.width));
    const maxH = Math.max(1, ...loaded.map((entry) => entry.height));
    const cellW = maxW + padding * 2;
    const cellH = maxH + padding * 2;
    const maxRowsByHeight = Math.max(1, Math.floor(maxSize / cellH) || 1);
    const minColumnsForHeight = Math.ceil(loaded.length / maxRowsByHeight);
    const maxColumnsByWidth = Math.max(1, Math.floor(maxSize / cellW) || 1);
    const columns = Math.max(1, Math.min(loaded.length, Math.max(minColumnsForHeight, Math.min(loaded.length, maxColumnsByWidth))));
    const rows = Math.ceil(loaded.length / columns);
    const width = Math.max(1, columns * cellW);
    const height = Math.max(1, rows * cellH);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false;
    const frames = {};
    for (let index = 0; index < loaded.length; index++) {
      const entry = loaded[index];
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = col * cellW + padding + Math.floor((maxW - entry.width) / 2);
      const y = row * cellH + padding + Math.floor((maxH - entry.height) / 2);
      ctx.drawImage(entry.image, x, y, entry.width, entry.height);
      frames[entry.fullPath] = { x, y, w: entry.width, h: entry.height };
    }
    return {
      width,
      height,
      columns,
      rows,
      cellWidth: cellW,
      cellHeight: cellH,
      frames,
      dataUrl: canvas.toDataURL("image/png")
    };
  }, {
    entries,
    maxSize: options.maxSize,
    padding: options.padding
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  assertInsideRepo(options.out);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  if (!files.length) throw new Error("assets/exported/asset-manifest.json has no files.");
  if (options.clean) fs.rmSync(options.out, { recursive: true, force: true });
  fs.mkdirSync(options.out, { recursive: true });

  const groups = new Map();
  for (const file of files) {
    const key = groupKeyFor(file);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(file);
  }

  const browser = await chromium.launch({ executablePath: chromeExecutable(), headless: true });
  const page = await browser.newPage();
  const atlas = {
    version: manifest.version,
    sourceVersion: manifest.version,
    generatedAt: new Date().toISOString(),
    maxSize: options.maxSize,
    padding: options.padding,
    sheets: [],
    frames: {}
  };

  try {
    for (const [group, groupFiles] of Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
      const sorted = groupFiles.slice().sort(sortFrames);
      const entries = sorted.map((file) => {
        const relative = normalizeSlash(file.path);
        const fullPath = `assets/exported/${relative}`;
        const sourcePath = path.join(exportedDir, relative);
        return {
          path: relative,
          fullPath,
          width: Math.max(1, Number(file.width) || 1),
          height: Math.max(1, Number(file.height) || 1),
          dataUrl: `data:image/png;base64,${fs.readFileSync(sourcePath).toString("base64")}`
        };
      });
      const sheet = await buildSheet(page, entries, options);
      const sheetRelative = `${safeSlug(group)}.png`;
      const sheetPath = path.join(options.out, sheetRelative);
      assertInsideRepo(sheetPath);
      fs.mkdirSync(path.dirname(sheetPath), { recursive: true });
      fs.writeFileSync(sheetPath, decodeDataUrl(sheet.dataUrl));
      const publicSheetPath = `assets/exported-atlas/${normalizeSlash(sheetRelative)}`;
      atlas.sheets.push({
        path: publicSheetPath,
        group,
        frames: entries.length,
        width: sheet.width,
        height: sheet.height,
        columns: sheet.columns,
        rows: sheet.rows,
        cellWidth: sheet.cellWidth,
        cellHeight: sheet.cellHeight
      });
      for (const [fullPath, frame] of Object.entries(sheet.frames)) {
        atlas.frames[fullPath] = { sheet: publicSheetPath, ...frame };
      }
    }
  } finally {
    await browser.close();
  }

  const manifestOut = path.join(options.out, "atlas-manifest.json");
  assertInsideRepo(manifestOut);
  fs.writeFileSync(manifestOut, `${JSON.stringify(atlas, null, 2)}\n`);
  console.log(`Built ${atlas.sheets.length} runtime atlas sheet(s) for ${Object.keys(atlas.frames).length} frame(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
