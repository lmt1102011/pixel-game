const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const { chromium } = require("playwright-core");

const repoRoot = path.resolve(__dirname, "..");
const outDir = path.resolve(repoRoot, "assets", "exported");
const exporterPage = path.resolve(__dirname, "asset-exporter.html");

function usage() {
  return [
    "Usage: node tools/export-assets.js [options]",
    "",
    "Options:",
    "  --category <name>       monster, character, skill, door, chest, background, trap",
    "  --kind <id>             Monster id, e.g. skeletonArcher",
    "  --character <id>        Character id, e.g. swordsman",
    "  --power <id>            Power id, e.g. fire",
    "  --key <q|e|r|f>         Skill key",
    "  --state <name>          idle, walk, attack, run, skill, ultimate, death, open",
    "  --frame <n|a-b>         One frame or a range, e.g. 0-3",
    "  --container <id>        woodChest, goldChest, treasureChest",
    "  --room <id>             Door/room id",
    "  --biome <id>            Background biome id",
    "  --path <text>           Keep only generated paths containing text",
    "  --frame-scale <n>       Export scale from 0.5 to 2",
    "  --keep                  Keep existing exported files and merge manifest",
    "  --help                  Show this help"
  ].join("\n");
}

function parseArgs(argv) {
  const options = { frameScale: 1, keep: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--keep") {
      options.keep = true;
      continue;
    }
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      options[key] = "true";
      continue;
    }
    options[key] = next;
    i++;
  }
  if (options.frameScale) options.frameScale = Number(options.frameScale) || 1;
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
  if (!found) throw new Error("Chrome/Edge executable not found. Set CHROME_PATH to export assets.");
  return found;
}

function decodeDataUrl(dataUrl) {
  const match = /^data:image\/png;base64,(.+)$/i.exec(String(dataUrl || ""));
  if (!match) throw new Error("Invalid PNG data URL");
  return Buffer.from(match[1], "base64");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  assertInsideRepo(outDir);
  assertInsideRepo(exporterPage);

  const manifestPath = path.join(outDir, "asset-manifest.json");
  let previousManifest = null;
  if (options.keep && fs.existsSync(manifestPath)) {
    try {
      previousManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch {
      previousManifest = null;
    }
  }
  if (!options.keep) fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: chromeExecutable(),
    headless: true
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });

  page.on("console", (message) => {
    const type = message.type();
    if (type === "error" || type === "warning") console.log(`[browser:${type}] ${message.text()}`);
  });

  await page.goto(pathToFileURL(exporterPage).href, { waitUntil: "load" });
  await page.waitForFunction(() => window.SoulriftAssetExporter && window.SoulriftAssetExporter.exportAll);
  const result = await page.evaluate((exportOptions) => window.SoulriftAssetExporter.exportAll(exportOptions), options);
  await browser.close();

  const manifest = {
    version: result.version,
    generatedAt: result.generatedAt,
    files: [],
    errors: result.errors || []
  };

  const merged = new Map();
  const order = [];
  if (previousManifest?.files?.length) {
    for (const file of previousManifest.files) {
      if (file?.path) {
        merged.set(file.path, file);
        order.push(file.path);
      }
    }
  }

  for (const file of result.files || []) {
    const relativePath = String(file.path || "").replace(/\\/g, "/");
    if (!relativePath || relativePath.startsWith("/") || relativePath.includes("..")) {
      throw new Error(`Unsafe asset path: ${relativePath}`);
    }
    const absolutePath = path.resolve(outDir, relativePath);
    assertInsideRepo(absolutePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, decodeDataUrl(file.dataUrl));
    if (!merged.has(relativePath)) order.push(relativePath);
    merged.set(relativePath, {
      path: relativePath,
      width: file.width,
      height: file.height,
      meta: file.meta || {}
    });
  }

  manifest.files = order.map((entryPath) => merged.get(entryPath)).filter(Boolean);

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  if (options.keep) {
    console.log(`Updated ${result.files?.length || 0} selected frame(s) in ${path.relative(repoRoot, outDir)}.`);
    console.log(`Manifest now tracks ${manifest.files.length} PNG files.`);
  } else {
    console.log(`Exported ${manifest.files.length} PNG files to ${path.relative(repoRoot, outDir)}`);
  }
  if (manifest.errors.length) {
    console.log(`Exporter reported ${manifest.errors.length} render errors. See asset-manifest.json.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
