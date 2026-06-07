const fs = require("fs");
const http = require("http");
const path = require("path");

const { chromium } = require("playwright-core");

const repoRoot = path.resolve(__dirname, "..");

function usage() {
  return [
    "Usage: node tools/perf-smoke.js [options]",
    "",
    "Runs a browser smoke benchmark and reports FPS, render time, preload state, and missing exported frames.",
    "",
    "Options:",
    "  --url <url>          Use an already running server instead of starting a local static server",
    "  --duration <sec>     Benchmark duration; default 8",
    "  --cooldown <sec>     Stop skill spam for the final seconds to test graphics recovery; default 2",
    "  --mobile             Emulate a landscape Android-like mobile viewport",
    "  --weak-device        Override navigator memory/cores to a weak 1GB/2-core profile",
    "  --min-fps <n>        Fail below this average FPS; default 30",
    "  --max-long <n>       Fail above this long-frame percentage; default 35",
    "  --strict-preload     Also fail when the exported preload queue has not fully settled",
    "  --scenario <name>    training, normal, or boss; default training",
    "  --difficulty <id>    Difficulty id for non-training runs; default normal",
    "  --power <id>         Power to test; default fire",
    "  --character <id>     Character to test; default swordsman",
    "  --no-audio           Disable music and SFX during the smoke run",
    "  --help               Show this help"
  ].join("\n");
}

function parseArgs(argv) {
  const options = {
    duration: 8,
    cooldown: 2,
    minFps: 30,
    maxLong: 35,
    power: "fire",
    character: "swordsman",
    scenario: "training",
    difficulty: "normal",
    mobile: false
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--mobile") options.mobile = true;
    else if (arg === "--weak-device") options.weakDevice = true;
    else if (arg === "--strict-preload") options.strictPreload = true;
    else if (arg === "--no-audio") options.noAudio = true;
    else if (arg === "--url") options.url = argv[++i] || "";
    else if (arg === "--duration") options.duration = Math.max(2, Number(argv[++i] || options.duration) || options.duration);
    else if (arg === "--cooldown") options.cooldown = Math.max(0, Number(argv[++i] || options.cooldown) || options.cooldown);
    else if (arg === "--min-fps") options.minFps = Math.max(1, Number(argv[++i] || options.minFps) || options.minFps);
    else if (arg === "--max-long") options.maxLong = Math.max(0, Number(argv[++i] || options.maxLong) || options.maxLong);
    else if (arg === "--scenario") options.scenario = (argv[++i] || options.scenario).toLowerCase();
    else if (arg === "--difficulty") options.difficulty = argv[++i] || options.difficulty;
    else if (arg === "--power") options.power = argv[++i] || options.power;
    else if (arg === "--character") options.character = argv[++i] || options.character;
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
  if (!found) throw new Error("Chrome/Edge executable not found. Set CHROME_PATH to run perf smoke.");
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

async function runBenchmark(page, options) {
  const durationMs = Math.round(options.duration * 1000);
  const cooldownMs = Math.min(durationMs - 500, Math.round(options.cooldown * 1000));
  return page.evaluate(async ({ durationMs, cooldownMs, powerId, characterId, noAudio, scenario, difficulty }) => {
    const game = window.soulrift;
    if (!game) throw new Error("Soulrift game object was not created");
    const accountKey = "perfsmoke";
    game.save.auth ||= { currentUser: "", accounts: {} };
    game.save.auth.currentUser = accountKey;
    game.save.auth.accounts ||= {};
    game.save.account.created = true;
    game.save.account.username = "PerfSmoke";
    game.save.account.createdAt ||= new Date().toISOString();
    game.save.account.ownedPowers = [powerId];
    game.save.account.selectedPower = powerId;
    game.save.account.selectedCharacter = characterId;
    game.save.settings.graphicsMode = "auto";
    game.save.settings.graphicsLevel = 5;
    game.save.settings.particles = 1.5;
    if (noAudio) {
      game.save.settings.music = false;
      game.save.settings.sfx = false;
    }
    if (game.save.powers?.[powerId]) {
      game.save.powers[powerId].unlocked = true;
      game.save.powers[powerId].level = Math.max(1, game.save.powers[powerId].level || 1);
    }
    game.save.auth.accounts[accountKey] = {
      username: "PerfSmoke",
      passwordHash: "",
      createdAt: game.save.account.createdAt,
      profile: game.profileSnapshot ? game.profileSnapshot() : {}
    };
    if (game.ensureAccountSocial) game.ensureAccountSocial(accountKey);
    game.queueCloudAccountSave = () => {};
    game.saveCloudAccountNow = async () => {};
    game.updateAccountCloudCheck = () => {};
    game.applyGraphicsSettings();
    const runScenario = ["training", "normal", "boss"].includes(scenario) ? scenario : "training";
    const runOptions = runScenario === "training"
      ? { training: true, trainingOptions: { damage: true, freeEnergy: true, noCooldown: true }, difficulty }
      : runScenario === "boss"
        ? { difficulty, miniGame: "bossRush" }
        : { difficulty };
    game.startSelectedRun("", runOptions);
    if (game.run?.currentRoom && runScenario !== "training") {
      game.run.currentRoom.intro = Math.min(Number(game.run.currentRoom.intro || 0), 0.2);
    }
    game.preloadCurrentRoomExportAssets(true);

    const keys = ["q", "e", "r", "f"];
    let actionIndex = 0;
    const action = () => {
      if (!game.run?.player || game.pauseOverlay) return;
      if (runScenario !== "training") {
        game.run.player.energy = game.run.player.maxEnergy;
      }
      const target = (game.run.enemies || []).find((enemy) => enemy && enemy.hp > 0) || game.run.enemies?.[0];
      if (target) {
        game.input.mouse.worldX = target.x;
        game.input.mouse.worldY = target.y;
        game.input.mouse.x = game.width * 0.62;
        game.input.mouse.y = game.height * 0.42;
      }
      game.attackBasic();
      game.useSkill(keys[actionIndex % keys.length]);
      actionIndex += 1;
    };

    const start = performance.now();
    let last = start;
    let frames = 0;
    let longFrames = 0;
    let severeFrames = 0;
    let totalDt = 0;
    let maxDt = 0;
    let maxDtAt = 0;
    let lateLongFrames = 0;
    let lateSevereFrames = 0;
    let maxRenderMs = 0;
    let renderTotal = 0;
    let renderSamples = 0;
    let maxUpdateMs = 0;
    let updateTotal = 0;
    let updateSamples = 0;
    let maxLoopMs = 0;
    let loopTotal = 0;
    let loopSamples = 0;
    let nextActionAt = start;

    return new Promise((resolve) => {
      const actionUntil = start + Math.max(500, durationMs - cooldownMs);
      const tick = (now) => {
        const dt = now - last;
        last = now;
        frames += 1;
        totalDt += dt;
        if (dt > maxDt) {
          maxDt = dt;
          maxDtAt = now - start;
        }
        if (dt > 34) longFrames += 1;
        if (dt > 50) severeFrames += 1;
        if (now - start > 1000) {
          if (dt > 34) lateLongFrames += 1;
          if (dt > 50) lateSevereFrames += 1;
        }
        const renderMs = Number(game.perf?.renderMs || 0);
        const updateMs = Number(game.perf?.updateMs || 0);
        const loopMs = Number(game.perf?.loopMs || 0);
        if (renderMs > 0) {
          renderTotal += renderMs;
          renderSamples += 1;
          maxRenderMs = Math.max(maxRenderMs, renderMs);
        }
        if (updateMs > 0) {
          updateTotal += updateMs;
          updateSamples += 1;
          maxUpdateMs = Math.max(maxUpdateMs, updateMs);
        }
        if (loopMs > 0) {
          loopTotal += loopMs;
          loopSamples += 1;
          maxLoopMs = Math.max(maxLoopMs, loopMs);
        }
        if (now < actionUntil && now >= nextActionAt) {
          action();
          nextActionAt = now + 280;
        }
        if (now - start < durationMs) {
          requestAnimationFrame(tick);
          return;
        }
        const avgFrameMs = totalDt / Math.max(1, frames);
        resolve({
          mode: game.mode,
          scenario: runScenario,
          roomType: game.run?.currentRoom?.type || "",
          enemies: game.run?.enemies?.length || 0,
          frames,
          avgFps: Math.round((1000 / Math.max(1, avgFrameMs)) * 10) / 10,
          avgFrameMs: Math.round(avgFrameMs * 100) / 100,
          maxFrameMs: Math.round(maxDt * 100) / 100,
          maxFrameAtMs: Math.round(maxDtAt * 100) / 100,
          longFramePercent: Math.round((longFrames / Math.max(1, frames)) * 1000) / 10,
          severeFramePercent: Math.round((severeFrames / Math.max(1, frames)) * 1000) / 10,
          lateLongFrames,
          lateSevereFrames,
          avgRenderMs: Math.round((renderTotal / Math.max(1, renderSamples)) * 100) / 100,
          maxRenderMs: Math.round(maxRenderMs * 100) / 100,
          avgUpdateMs: Math.round((updateTotal / Math.max(1, updateSamples)) * 100) / 100,
          maxUpdateMs: Math.round(maxUpdateMs * 100) / 100,
          avgLoopMs: Math.round((loopTotal / Math.max(1, loopSamples)) * 100) / 100,
          maxLoopMs: Math.round(maxLoopMs * 100) / 100,
          resizeCount: Number(game.perf?.resizeCount || 0),
          lastResizeMs: Math.round(Number(game.perf?.resizeMs || 0) * 100) / 100,
          maxResizeMs: Math.round(Number(game.perf?.maxResizeMs || 0) * 100) / 100,
          autoLevel: Math.round(Number(game.perf?.displayedAutoLevel || 0) * 100) / 100,
          coreAutoLevel: Math.round(Number(game.perf?.coreAutoLevel || game.perf?.displayedAutoLevel || 0) * 100) / 100,
          targetAutoLevel: Math.round(Number(game.perf?.targetAutoLevel || 0) * 100) / 100,
          effectQuality: Math.round(Number(game.perf?.effectQuality || 0) * 1000) / 1000,
          renderScale: Math.round(Number(game.perf?.appliedRenderScale || 0) * 1000) / 1000,
          dpr: Math.round(Number(game.dpr || 0) * 1000) / 1000,
          lagTime: Math.round(Number(game.perf?.lagTime || 0) * 1000) / 1000,
          schedulerLagTime: Math.round(Number(game.perf?.schedulerLagTime || 0) * 1000) / 1000,
          stableTime: Math.round(Number(game.perf?.stableTime || 0) * 1000) / 1000,
          overloadTime: Math.round(Number(game.perf?.overloadTime || 0) * 1000) / 1000,
          skillQuietTime: Math.round(Number(game.perf?.skillQuietTime || 0) * 1000) / 1000,
          weakBias: Math.round(Number(game.devicePerformanceBias?.() || 0) * 1000) / 1000,
          combatLoad: Math.round(Number(game.graphicsCombatLoad?.() || 0) * 1000) / 1000,
          performancePressure: Math.round(Number(game.performancePressure?.() || 0) * 1000) / 1000,
          renderPressure: Math.round(Number(game.renderPressure?.() || 0) * 1000) / 1000,
          updateSpikeHold: Math.round(Number(game.perf?.updateSpikeHold || 0) * 1000) / 1000,
          renderSpikeHold: Math.round(Number(game.perf?.renderSpikeHold || 0) * 1000) / 1000,
          loopSpikeHold: Math.round(Number(game.perf?.loopSpikeHold || 0) * 1000) / 1000,
          readyImages: [...game.exportedAssetImages.values()].filter((image) => game.isExportedImageReady(image)).length,
          cachedImages: game.exportedAssetImages.size,
          cachedBitmaps: game.exportedAssetBitmaps?.size || 0,
          bitmapMegapixels: Math.round(((game.exportedAssetBitmapPixels || 0) / 1000000) * 10) / 10,
          cachedPatterns: game.exportedAssetPatterns?.size || 0,
          pooledObjects: Object.fromEntries(Object.entries(game.objectPools || {}).map(([key, pool]) => [key, Array.isArray(pool) ? pool.length : 0])),
          queuedAssets: game.exportedAssetPreloadQueue.length,
          activePreloads: game.exportedAssetPreloadActive,
          activePreloadPaths: Array.from(game.exportedAssetPreloadActivePaths || []).slice(0, 8),
          priorityQueuedAssets: game.exportedAssetPriorityQueued?.size || 0,
          priorityActivePreloads: game.exportedAssetPreloadActivePriorityPaths?.size || 0,
          priorityActivePreloadPaths: Array.from(game.exportedAssetPreloadActivePriorityPaths || []).slice(0, 8),
          loadTimeouts: [...game.exportedAssetImages.values()].filter((image) => image?._soulriftLoadTimedOutAt).length,
          loadTimeoutPaths: [...game.exportedAssetImages.values()].filter((image) => image?._soulriftLoadTimedOutAt).map((image) => image._soulriftPath || "").filter(Boolean).slice(0, 8),
          missingImages: game.exportedAssetMissing.size,
          particles: game.run?.particles?.length || 0,
          effects: game.run?.effects?.length || 0,
          projectiles: game.run?.projectiles?.length || 0,
          version: document.querySelector('meta[name="soulrift-version"]')?.content || "",
          cooldownSec: Math.round((cooldownMs / 1000) * 10) / 10
        });
      };
      requestAnimationFrame(tick);
    });
  }, {
    durationMs,
    cooldownMs,
    powerId: options.power,
    characterId: options.character,
    noAudio: Boolean(options.noAudio),
    scenario: options.scenario,
    difficulty: options.difficulty
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
    userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel PerfSmoke) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36"
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
    const url = `${serverInfo.url}${serverInfo.url.includes("?") ? "&" : "?"}perf-smoke=${Date.now()}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.soulrift || window.startSoulriftGame, null, { timeout: 15000 });
    await page.evaluate(() => {
      if (!window.soulrift && window.startSoulriftGame) window.startSoulriftGame();
    });
    await page.waitForFunction(() => window.soulrift && window.soulrift.bootReady, null, { timeout: 15000 });
    await page.waitForTimeout(900);
    const metrics = await runBenchmark(page, options);
    if (errors.length) throw new Error(errors.join("\n"));
    const failures = [];
    const expectedRoom = options.scenario === "boss" ? "boss" : options.scenario === "normal" ? "normal" : "training";
    if (metrics.mode !== "game" || metrics.roomType !== expectedRoom) failures.push(`Expected ${expectedRoom} game mode, got ${metrics.mode}/${metrics.roomType}`);
    if (metrics.avgFps < options.minFps) failures.push(`Average FPS ${metrics.avgFps} is below ${options.minFps}`);
    if (metrics.longFramePercent > options.maxLong) failures.push(`Long-frame rate ${metrics.longFramePercent}% is above ${options.maxLong}%`);
    if (metrics.missingImages > 0) failures.push(`${metrics.missingImages} exported image(s) missing at runtime`);
    if (options.strictPreload && (metrics.priorityQueuedAssets > 0 || metrics.priorityActivePreloads > 0)) {
      failures.push(`Priority preload did not settle: queued=${metrics.priorityQueuedAssets}, active=${metrics.priorityActivePreloads}`);
    }
    if (options.strictPreload && metrics.loadTimeouts > 0) failures.push(`Preload timed out for ${metrics.loadTimeouts} image(s): ${(metrics.loadTimeoutPaths || []).join(", ")}`);
    console.log(JSON.stringify(metrics, null, 2));
    if (failures.length) {
      console.error("Perf smoke failed:");
      for (const failure of failures) console.error(`- ${failure}`);
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    if (localServer) await new Promise((resolve) => localServer.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
