const fs = require("fs");
const http = require("http");
const path = require("path");

const { chromium } = require("playwright-core");

const repoRoot = path.resolve(__dirname, "..");

function usage() {
  return [
    "Usage: node tools/frame-stability-smoke.js [options]",
    "",
    "Verifies exported animation sequences stay visually stable while only partially loaded.",
    "",
    "Options:",
    "  --url <url>       Use an already running server instead of starting a local static server",
    "  --mobile          Emulate a landscape Android-like mobile viewport",
    "  --weak-device     Override navigator memory/cores to a weak 1GB/2-core profile",
    "  --help            Show this help"
  ].join("\n");
}

function parseArgs(argv) {
  const options = { mobile: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--mobile") options.mobile = true;
    else if (arg === "--weak-device") options.weakDevice = true;
    else if (arg === "--url") options.url = argv[++i] || "";
  }
  return options;
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
  if (!found) throw new Error("Chrome/Edge executable not found. Set CHROME_PATH to run frame stability smoke.");
  return found;
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml; charset=utf-8",
    ".ico": "image/x-icon"
  }[ext] || "application/octet-stream";
}

function startStaticServer() {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const target = path.resolve(repoRoot, `.${pathname}`);
    const relative = path.relative(repoRoot, target);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    fs.readFile(target, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      response.writeHead(200, {
        "Content-Type": contentType(target),
        "Cache-Control": "no-store"
      });
      response.end(data);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, url: `http://127.0.0.1:${address.port}/` });
    });
  });
}

async function runStabilitySmoke(page) {
  return page.evaluate(async () => {
    const game = window.soulrift;
    if (!game) throw new Error("Soulrift game object was not created");

    const originalDrain = game.scheduleExportedPreloadDrain;
    game.scheduleExportedPreloadDrain = () => {};

    const resetAssetRuntime = () => {
      game.exportedAssetImages = new Map();
      game.exportedAssetFallback = new Map();
      game.exportedAssetQueued = new Set();
      game.exportedAssetQueuedSequences = new Set();
      game.exportedAssetPriorityQueued = new Set();
      game.exportedAssetPreloadQueue = [];
      game.exportedAssetPreloadActive = 0;
      game.exportedAssetPreloadActivePaths = new Set();
      game.exportedAssetPreloadActivePriorityPaths = new Set();
    };

    const loadFrame = (sourcePath) => new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        game.exportedAssetImages.set(sourcePath, image);
        game.markExportedImageReady(sourcePath, image);
        resolve(image);
      };
      image.onerror = () => reject(new Error(`Failed to load ${sourcePath}`));
      image.src = game.exportedAssetUrl(sourcePath);
    });

    const assert = (condition, message) => {
      if (!condition) throw new Error(message);
    };

    const checkSequence = async (label, firstPath) => {
      resetAssetRuntime();
      const paths = game.exportedSequencePaths(firstPath);
      assert(paths.length >= 2, `${label}: expected an animation sequence`);
      const targetIndex = Math.min(paths.length - 1, Math.max(1, Math.floor(paths.length / 2)));
      const first = await loadFrame(paths[0]);
      const partial = game.exportedImage(paths[targetIndex], { stableSequence: true });
      assert(partial === first, `${label}: partial sequence did not hold frame 00`);

      const middle = await loadFrame(paths[targetIndex]);
      const partialAfterMiddle = game.exportedImage(paths[paths.length - 1], { stableSequence: true });
      assert(partialAfterMiddle === first, `${label}: fallback changed before full sequence loaded`);
      assert(game.exportedAssetFallback.get(game.exportedSequenceKey(firstPath)) === first, `${label}: sequence fallback was not stable`);

      const loaded = new Map([[paths[0], first], [paths[targetIndex], middle]]);
      for (const sourcePath of paths) {
        if (!loaded.has(sourcePath)) loaded.set(sourcePath, await loadFrame(sourcePath));
      }
      assert(game.exportedSequenceReady(firstPath), `${label}: sequence did not report ready after all frames loaded`);
      const final = game.exportedImage(paths[paths.length - 1], { stableSequence: true });
      assert(final === loaded.get(paths[paths.length - 1]), `${label}: full sequence did not return requested frame`);
      return {
        label,
        frames: paths.length,
        heldFrame00: true,
        returnedFinalFrame: true
      };
    };

    const checks = [];
    for (const [label, firstPath] of [
      ["character-run", "assets/exported/characters/swordsman/run_00.png"],
      ["monster-walk", "assets/exported/monsters/skeletonArcher/walk_00.png"],
      ["skill-fire-q", "assets/exported/skills/fire/q/normal_00.png"],
      ["chest-gold", "assets/exported/chests/goldChest/open_00.png"],
      ["door-boss", "assets/exported/doors/bossGate/grow_00.png"],
      ["trap-blade", "assets/exported/traps/blade/active_00.png"]
    ]) {
      checks.push(await checkSequence(label, firstPath));
    }

    resetAssetRuntime();
    for (const sourcePath of game.exportedSequencePaths("assets/exported/skills/fire/q/normal_00.png")) {
      await loadFrame(sourcePath);
    }
    game.perf.updateSpikeHold = 1;
    game.perf.renderSpikeHold = 1;
    game.perf.loopSpikeHold = 1;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext("2d");
    const drawnDuringSpike = game.drawExportedSkillShape(ctx, {
      type: "skillShape",
      kind: "fire",
      skillKey: "q",
      x: 256,
      y: 192,
      angle: 0,
      radius: 160,
      time: 0.22,
      maxTime: 0.55,
      color: "#ff5f3d",
      accent: "#ffd166"
    }, 0.55, 1, 160);
    assert(drawnDuringSpike, "skill renderer switched away from exported frames during a spike");

    game.scheduleExportedPreloadDrain = originalDrain;

    return {
      version: document.querySelector('meta[name="soulrift-version"]')?.content || "",
      checkedSequences: checks,
      drawnDuringSpike
    };
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  let localServer = null;
  const serverInfo = options.url ? { url: options.url } : await startStaticServer();
  localServer = serverInfo.server || null;

  const browser = await chromium.launch({
    executablePath: chromeExecutable(),
    headless: true,
    args: [
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding"
    ]
  });
  const context = await browser.newContext(options.mobile ? {
    viewport: { width: 896, height: 414 },
    deviceScaleFactor: 1.5,
    isMobile: true,
    hasTouch: true,
    userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel FrameSmoke) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36"
  } : {
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });
  if (options.weakDevice) {
    await context.addInitScript(() => {
      try {
        Object.defineProperty(Navigator.prototype, "deviceMemory", { configurable: true, get: () => 1 });
        Object.defineProperty(Navigator.prototype, "hardwareConcurrency", { configurable: true, get: () => 2 });
      } catch {
        Object.defineProperty(navigator, "deviceMemory", { configurable: true, get: () => 1 });
        Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, get: () => 2 });
      }
    });
  }
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  try {
    const url = `${serverInfo.url}${serverInfo.url.includes("?") ? "&" : "?"}frame-stability=${Date.now()}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.soulrift || window.startSoulriftGame, null, { timeout: 15000 });
    await page.evaluate(() => {
      if (!window.soulrift && window.startSoulriftGame) window.startSoulriftGame();
    });
    await page.waitForFunction(() => window.soulrift && window.soulrift.bootReady, null, { timeout: 15000 });
    const result = await runStabilitySmoke(page);
    if (errors.length) throw new Error(errors.join("\n"));
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
    if (localServer) await new Promise((resolve) => localServer.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
