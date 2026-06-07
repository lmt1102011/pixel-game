const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const outDir = path.resolve(repoRoot, "assets", "exported");
const manifestPath = path.join(outDir, "asset-manifest.json");

function usage() {
  return [
    "Usage: node tools/verify-exported-assets.js [options]",
    "",
    "Checks exported PNG frames for missing files, broken PNG headers, wrong dimensions, duplicate manifest paths, and incomplete animation sequences.",
    "",
    "Options:",
    "  --category <name>       Only verify a category, e.g. monster, character, skill",
    "  --browser-decode        Decode selected PNGs in Chrome/Edge for a stronger image check",
    "  --pixel-check           Also reject blank or nearly empty decoded frames",
    "  --limit <n>             Max files for browser decode/pixel check; default 180",
    "  --help                  Show this help"
  ].join("\n");
}

function parseArgs(argv) {
  const options = { browserDecode: false, limit: 180 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--browser-decode") options.browserDecode = true;
    else if (arg === "--pixel-check") {
      options.pixelCheck = true;
      options.browserDecode = true;
    }
    else if (arg === "--category") options.category = argv[++i] || "";
    else if (arg === "--limit") options.limit = Math.max(1, Number(argv[++i] || 180) || 180);
  }
  return options;
}

function assertInsideRepo(targetPath) {
  const relative = path.relative(repoRoot, targetPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to read outside repo: ${targetPath}`);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function pngSize(buffer) {
  const signature = "89504e470d0a1a0a";
  if (!Buffer.isBuffer(buffer) || buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) {
    throw new Error("Invalid PNG signature");
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function addIssue(issues, type, file, message) {
  issues.push({ type, path: file?.path || "", message });
}

function frameSet(files, predicate) {
  return new Set(files.filter(predicate).map((file) => Number(file.meta?.frame)).filter(Number.isFinite));
}

function expectFrames(issues, files, label, expected) {
  const frames = frameSet(files, () => true);
  for (const frame of expected) {
    if (!frames.has(frame)) addIssue(issues, "missing-frame", { path: label }, `Missing frame ${frame}`);
  }
}

function grouped(files, keyFn) {
  const groups = new Map();
  for (const file of files) {
    const key = keyFn(file);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(file);
  }
  return groups;
}

function verifySequences(files, issues) {
  const byMonster = grouped(files, (file) => {
    const meta = file.meta || {};
    return meta.category === "monster" ? `${meta.kind}|${meta.state}` : "";
  });
  for (const [key, group] of byMonster) {
    const [, state] = key.split("|");
    const expected = state === "idle" ? [0, 1] : state === "attack" ? [0, 1, 2] : [0, 1, 2, 3];
    expectFrames(issues, group, `monsters/${key}`, expected);
  }

  const byCharacter = grouped(files, (file) => {
    const meta = file.meta || {};
    return meta.category === "character" ? `${meta.character}|${meta.state}` : "";
  });
  for (const [key, group] of byCharacter) {
    const [, state] = key.split("|");
    const expected = state === "idle" ? [0, 1] : [0, 1, 2, 3];
    expectFrames(issues, group, `characters/${key}`, expected);
  }

  const bySkill = grouped(files, (file) => {
    const meta = file.meta || {};
    return meta.category === "skill" ? `${meta.power}|${meta.key}|${meta.awakened ? "awakened" : "normal"}` : "";
  });
  for (const [key, group] of bySkill) expectFrames(issues, group, `skills/${key}`, [0, 1, 2, 3]);

  const byDoor = grouped(files, (file) => {
    const meta = file.meta || {};
    return meta.category === "door" ? `${meta.roomType}` : "";
  });
  for (const [key, group] of byDoor) expectFrames(issues, group, `doors/${key}`, [0, 1, 2, 3, 4]);

  const byChest = grouped(files, (file) => {
    const meta = file.meta || {};
    return meta.category === "chest" ? `${meta.container}` : "";
  });
  for (const [key, group] of byChest) expectFrames(issues, group, `chests/${key}`, [0, 1, 2, 3, 4, 5]);

  const byTrap = grouped(files, (file) => {
    const meta = file.meta || {};
    return meta.category === "trap" ? `${meta.type}` : "";
  });
  for (const [key, group] of byTrap) expectFrames(issues, group, `traps/${key}`, [0, 1, 2, 3, 4, 5]);

  const byBackground = grouped(files, (file) => {
    const meta = file.meta || {};
    return meta.category === "background" ? `${meta.biome}` : "";
  });
  for (const [key, group] of byBackground) {
    const assets = new Set(group.map((file) => file.meta?.asset).filter(Boolean));
    for (const asset of ["floorTile", "roomCrop"]) {
      if (!assets.has(asset)) addIssue(issues, "missing-background", { path: `backgrounds/${key}` }, `Missing ${asset}`);
    }
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
  return candidates.find((candidate) => fs.existsSync(candidate));
}

async function browserDecode(files, limit, options = {}) {
  const executablePath = chromeExecutable();
  if (!executablePath) throw new Error("Chrome/Edge executable not found. Set CHROME_PATH to use --browser-decode.");
  const { chromium } = require("playwright-core");
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage();
  const selectedFiles = files.slice(0, limit);
  const results = [];
  const batchSize = 12;
  for (let i = 0; i < selectedFiles.length; i += batchSize) {
    const batch = selectedFiles.slice(i, i + batchSize).map((file) => ({
      path: file.path,
      dataUrl: `data:image/png;base64,${fs.readFileSync(path.join(outDir, file.path)).toString("base64")}`,
      width: file.width,
      height: file.height
    }));
    const decoded = await page.evaluate(async ({ entries, pixelCheck }) => {
      const loadWithImage = (entry) => new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
          resolve({
            path: entry.path,
            ok: image.naturalWidth === entry.width && image.naturalHeight === entry.height,
            width: image.naturalWidth,
            height: image.naturalHeight,
            error: image.naturalWidth === entry.width && image.naturalHeight === entry.height ? "" : `Decoded ${image.naturalWidth}x${image.naturalHeight}`
          });
        };
        image.onerror = () => resolve({ path: entry.path, ok: false, error: "Browser image load failed" });
        image.src = entry.dataUrl;
      });
      const inspectPixels = (image, entry) => {
        const canvas = document.createElement("canvas");
        canvas.width = entry.width;
        canvas.height = entry.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return { ok: false, error: "Canvas context unavailable" };
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let visible = 0;
        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = -1;
        let maxY = -1;
        const colors = new Set();
        for (let offset = 0; offset < data.length; offset += 4) {
          const alpha = data[offset + 3];
          if (alpha <= 6) continue;
          visible += 1;
          const pixelIndex = offset / 4;
          const x = pixelIndex % canvas.width;
          const y = Math.floor(pixelIndex / canvas.width);
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          if (colors.size < 48) {
            colors.add(`${data[offset] >> 4},${data[offset + 1] >> 4},${data[offset + 2] >> 4},${alpha >> 4}`);
          }
        }
        const area = canvas.width * canvas.height;
        const minVisible = Math.max(6, Math.ceil(area * (entry.category === "background" ? 0.02 : 0.0009)));
        if (visible < minVisible) {
          return { ok: false, error: `Only ${visible} visible pixel(s), expected at least ${minVisible}` };
        }
        const boundsW = Math.max(0, maxX - minX + 1);
        const boundsH = Math.max(0, maxY - minY + 1);
        if (boundsW <= 1 || boundsH <= 1) return { ok: false, error: `Visible bounds too small: ${boundsW}x${boundsH}` };
        if (colors.size <= 1 && entry.category !== "background") return { ok: false, error: "Frame has almost no color variation" };
        return { ok: true, visible, boundsW, boundsH, colors: colors.size };
      };
      const decodeOne = async (entry) => {
        let imageResult = null;
        let image = null;
        const loadImage = () => new Promise((resolve) => {
          const element = new Image();
          element.onload = () => resolve(element);
          element.onerror = () => resolve(null);
          element.src = entry.dataUrl;
        });
        if ("createImageBitmap" in window) {
          try {
            const response = await fetch(entry.dataUrl);
            const blob = await response.blob();
            const bitmap = await createImageBitmap(blob);
            const ok = bitmap.width === entry.width && bitmap.height === entry.height;
            imageResult = {
              path: entry.path,
              ok,
              width: bitmap.width,
              height: bitmap.height,
              error: ok ? "" : `Decoded ${bitmap.width}x${bitmap.height}`
            };
            if (bitmap.close) bitmap.close();
          } catch (error) {
            imageResult = { path: entry.path, ok: false, error: error?.message || String(error) };
          }
        } else {
          imageResult = await loadWithImage(entry);
        }
        if (!imageResult.ok || !pixelCheck) return imageResult;
        image = await loadImage();
        if (!image) return { path: entry.path, ok: false, error: "Browser image load failed during pixel check" };
        const pixels = inspectPixels(image, entry);
        return pixels.ok
          ? { ...imageResult, pixels }
          : { path: entry.path, ok: false, error: pixels.error };
      };
      const output = [];
      for (const entry of entries) output.push(await decodeOne(entry));
      return output;
    }, {
      entries: batch.map((entry) => ({ ...entry, category: entry.path.split("/")[0]?.replace(/s$/, "") })),
      pixelCheck: Boolean(options.pixelCheck)
    });
    results.push(...decoded);
  }
  await browser.close();
  return results.filter((result) => !result.ok);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  assertInsideRepo(manifestPath);
  const manifest = readJson(manifestPath);
  const versionFile = readJson(path.join(repoRoot, "version.json"));
  const files = (manifest.files || []).filter((file) => !options.category || file.meta?.category === options.category);
  const issues = [];
  const seen = new Set();

  if (manifest.version !== versionFile.version) {
    addIssue(issues, "version", { path: "asset-manifest.json" }, `Manifest version ${manifest.version} does not match version.json ${versionFile.version}`);
  }

  for (const file of files) {
    if (!file?.path || file.path.includes("..") || path.isAbsolute(file.path)) {
      addIssue(issues, "path", file, "Unsafe or empty manifest path");
      continue;
    }
    if (seen.has(file.path)) addIssue(issues, "duplicate", file, "Duplicate manifest path");
    seen.add(file.path);
    const absolutePath = path.join(outDir, file.path);
    assertInsideRepo(absolutePath);
    if (!fs.existsSync(absolutePath)) {
      addIssue(issues, "missing-file", file, "PNG file is missing on disk");
      continue;
    }
    try {
      const stat = fs.statSync(absolutePath);
      if (stat.size < 80) addIssue(issues, "size", file, `PNG file is suspiciously small (${stat.size} bytes)`);
      const size = pngSize(fs.readFileSync(absolutePath));
      if (size.width !== file.width || size.height !== file.height) {
        addIssue(issues, "dimension", file, `Manifest ${file.width}x${file.height}, PNG ${size.width}x${size.height}`);
      }
    } catch (error) {
      addIssue(issues, "png", file, error?.message || String(error));
    }
  }

  verifySequences(files, issues);

  if (options.browserDecode) {
    const decodeIssues = await browserDecode(files, options.limit);
    for (const result of decodeIssues) addIssue(issues, "browser-decode", { path: result.path }, result.error || `Decoded ${result.width}x${result.height}`);
  }

  if (issues.length) {
    console.error(`Exported asset verification failed: ${issues.length} issue(s).`);
    for (const issue of issues.slice(0, 80)) {
      console.error(`- [${issue.type}] ${issue.path}: ${issue.message}`);
    }
    if (issues.length > 80) console.error(`...and ${issues.length - 80} more.`);
    process.exit(1);
  }

  const categories = files.reduce((counts, file) => {
    const key = file.meta?.category || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  console.log(`Verified ${files.length} exported PNG frame(s).`);
  console.log(JSON.stringify(categories));
  if (options.browserDecode) console.log(`Browser-decoded ${Math.min(files.length, options.limit)} selected frame(s).`);
  if (options.pixelCheck) console.log(`Pixel-checked ${Math.min(files.length, options.limit)} selected frame(s) for visible content.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
