const fs = require("fs");
const path = require("path");

const { chromium } = require("playwright-core");

const repoRoot = path.resolve(__dirname, "..");
const exportedDir = path.resolve(repoRoot, "assets", "exported");
const manifestPath = path.join(exportedDir, "asset-manifest.json");
const defaultOutDir = path.resolve(repoRoot, "assets", "exported-sheets");

function usage() {
  return [
    "Usage: node tools/make-asset-sheets.js [options]",
    "",
    "Builds editable sprite sheets from assets/exported/asset-manifest.json.",
    "",
    "Options:",
    "  --category <name>       monster, character, skill, door, chest, background, trap",
    "  --kind <id>             Monster id, e.g. skeletonArcher",
    "  --character <id>        Character id, e.g. swordsman",
    "  --power <id>            Power id, e.g. fire",
    "  --key <q|e|r|f>         Skill key",
    "  --state <name>          idle, walk, attack, run, skill, ultimate, death",
    "  --container <id>        woodChest, goldChest, treasureChest",
    "  --room <id>             Door/room id",
    "  --biome <id>            Background biome id",
    "  --path <text>           Keep only source paths containing text",
    "  --out <dir>             Output directory; default assets/exported-sheets",
    "  --columns <n>           Fixed columns; default auto",
    "  --padding <n>           Transparent padding around each frame; default 2",
    "  --scale <n>             Draw scale from 0.25 to 4; default 1",
    "  --labels                Draw small frame labels under cells",
    "  --clean                 Remove the output directory before writing",
    "  --help                  Show this help"
  ].join("\n");
}

function parseArgs(argv) {
  const options = {
    out: defaultOutDir,
    columns: 0,
    padding: 2,
    scale: 1,
    labels: false,
    clean: false
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--labels") options.labels = true;
    else if (arg === "--clean") options.clean = true;
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
  options.out = path.resolve(repoRoot, String(options.out || defaultOutDir));
  options.columns = Math.max(0, Number(options.columns || 0) || 0);
  options.padding = Math.max(0, Math.min(32, Number(options.padding ?? 2) || 0));
  options.scale = Math.max(0.25, Math.min(4, Number(options.scale || 1) || 1));
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
  if (!found) throw new Error("Chrome/Edge executable not found. Set CHROME_PATH to build sheets.");
  return found;
}

function safeSlug(value) {
  return String(value || "asset")
    .replace(/\\/g, "/")
    .replace(/[^a-z0-9/_-]+/gi, "-")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "");
}

function decodeDataUrl(dataUrl) {
  const match = /^data:image\/png;base64,(.+)$/i.exec(String(dataUrl || ""));
  if (!match) throw new Error("Invalid PNG data URL");
  return Buffer.from(match[1], "base64");
}

function fileMatches(file, options) {
  const meta = file.meta || {};
  const checks = [
    ["category", meta.category],
    ["kind", meta.kind],
    ["character", meta.character],
    ["power", meta.power],
    ["key", meta.key],
    ["state", meta.state],
    ["container", meta.container],
    ["room", meta.roomType],
    ["biome", meta.biome]
  ];
  for (const [optionKey, value] of checks) {
    if (options[optionKey] && String(value || "") !== String(options[optionKey])) return false;
  }
  if (options.path && !String(file.path || "").includes(String(options.path))) return false;
  return true;
}

function groupKeyFor(file) {
  const meta = file.meta || {};
  if (meta.category === "monster") return `monsters/${meta.kind}/${meta.state}`;
  if (meta.category === "character") return `characters/${meta.character}/${meta.state}`;
  if (meta.category === "skill") return `skills/${meta.power}/${meta.key}/${meta.awakened ? "awakened" : "normal"}`;
  if (meta.category === "door") return `doors/${meta.roomType || "door"}`;
  if (meta.category === "chest") return `chests/${meta.container || "chest"}`;
  if (meta.category === "trap") return `traps/${meta.type || "trap"}`;
  if (meta.category === "background") return `backgrounds/${meta.biome || "biome"}`;
  return path.dirname(String(file.path || "asset")).replace(/\\/g, "/");
}

function sortFrames(a, b) {
  const af = Number(a.meta?.frame);
  const bf = Number(b.meta?.frame);
  if (Number.isFinite(af) && Number.isFinite(bf) && af !== bf) return af - bf;
  const aa = String(a.meta?.asset || a.path || "");
  const bb = String(b.meta?.asset || b.path || "");
  return aa.localeCompare(bb);
}

async function buildSheet(page, entries, options) {
  return page.evaluate(async ({ entries, columns, padding, scale, labels }) => {
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
    const labelH = labels ? 18 : 0;
    const cols = columns > 0 ? columns : Math.ceil(Math.sqrt(loaded.length));
    const rows = Math.ceil(loaded.length / cols);
    const cellW = Math.ceil(maxW * scale) + padding * 2;
    const cellH = Math.ceil(maxH * scale) + padding * 2 + labelH;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, cols * cellW);
    canvas.height = Math.max(1, rows * cellH);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    for (let index = 0; index < loaded.length; index++) {
      const entry = loaded[index];
      const col = index % cols;
      const row = Math.floor(index / cols);
      const drawW = Math.round(entry.width * scale);
      const drawH = Math.round(entry.height * scale);
      const x = col * cellW + padding + Math.floor((cellW - padding * 2 - drawW) / 2);
      const y = row * cellH + padding + Math.floor((cellH - padding * 2 - labelH - drawH) / 2);
      ctx.drawImage(entry.image, x, y, drawW, drawH);
      if (labels) {
        ctx.font = "10px monospace";
        ctx.fillStyle = "rgba(236,232,225,0.95)";
        ctx.textAlign = "center";
        ctx.fillText(String(entry.label || index), col * cellW + cellW / 2, row * cellH + cellH - 5);
      }
    }
    return {
      width: canvas.width,
      height: canvas.height,
      columns: cols,
      rows,
      dataUrl: canvas.toDataURL("image/png")
    };
  }, {
    entries,
    columns: options.columns,
    padding: options.padding,
    scale: options.scale,
    labels: options.labels
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
  const files = (manifest.files || []).filter((file) => fileMatches(file, options));
  if (!files.length) throw new Error("No exported frames matched the selected filters.");
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
  const sheetManifest = {
    sourceVersion: manifest.version,
    generatedAt: new Date().toISOString(),
    files: []
  };

  try {
    for (const [key, group] of groups) {
      const sorted = group.slice().sort(sortFrames);
      const entries = sorted.map((file, index) => {
        const sourcePath = path.join(exportedDir, file.path);
        const label = Number.isFinite(Number(file.meta?.frame))
          ? `f${String(file.meta.frame).padStart(2, "0")}`
          : file.meta?.asset || String(index);
        return {
          path: file.path,
          width: file.width,
          height: file.height,
          label,
          dataUrl: `data:image/png;base64,${fs.readFileSync(sourcePath).toString("base64")}`
        };
      });
      const sheet = await buildSheet(page, entries, options);
      const relativeSheetPath = `${safeSlug(key)}.png`;
      const absoluteSheetPath = path.join(options.out, relativeSheetPath);
      assertInsideRepo(absoluteSheetPath);
      fs.mkdirSync(path.dirname(absoluteSheetPath), { recursive: true });
      fs.writeFileSync(absoluteSheetPath, decodeDataUrl(sheet.dataUrl));
      sheetManifest.files.push({
        path: relativeSheetPath.replace(/\\/g, "/"),
        sourceGroup: key,
        frames: sorted.length,
        width: sheet.width,
        height: sheet.height,
        columns: sheet.columns,
        rows: sheet.rows,
        sources: sorted.map((file) => file.path)
      });
    }
  } finally {
    await browser.close();
  }

  const manifestOut = path.join(options.out, "asset-sheets.json");
  assertInsideRepo(manifestOut);
  fs.writeFileSync(manifestOut, `${JSON.stringify(sheetManifest, null, 2)}\n`);
  console.log(`Built ${sheetManifest.files.length} sprite sheet(s) in ${path.relative(repoRoot, options.out)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
