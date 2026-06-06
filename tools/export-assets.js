const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const { chromium } = require("playwright-core");

const repoRoot = path.resolve(__dirname, "..");
const outDir = path.resolve(repoRoot, "assets", "exported");
const exporterPage = path.resolve(__dirname, "asset-exporter.html");

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
  assertInsideRepo(outDir);
  assertInsideRepo(exporterPage);

  fs.rmSync(outDir, { recursive: true, force: true });
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
  const result = await page.evaluate(() => window.SoulriftAssetExporter.exportAll({ frameScale: 1 }));
  await browser.close();

  const manifest = {
    version: result.version,
    generatedAt: result.generatedAt,
    files: [],
    errors: result.errors || []
  };

  for (const file of result.files || []) {
    const relativePath = String(file.path || "").replace(/\\/g, "/");
    if (!relativePath || relativePath.startsWith("/") || relativePath.includes("..")) {
      throw new Error(`Unsafe asset path: ${relativePath}`);
    }
    const absolutePath = path.resolve(outDir, relativePath);
    assertInsideRepo(absolutePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, decodeDataUrl(file.dataUrl));
    manifest.files.push({
      path: relativePath,
      width: file.width,
      height: file.height,
      meta: file.meta || {}
    });
  }

  fs.writeFileSync(path.join(outDir, "asset-manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Exported ${manifest.files.length} PNG files to ${path.relative(repoRoot, outDir)}`);
  if (manifest.errors.length) {
    console.log(`Exporter reported ${manifest.errors.length} render errors. See asset-manifest.json.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
