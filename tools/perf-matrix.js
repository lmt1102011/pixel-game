const { spawnSync } = require("child_process");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const perfSmoke = path.join(__dirname, "perf-smoke.js");

const POWERS = ["fire", "ice", "lightning", "shadow", "blood", "gravity", "crystal", "nature", "void", "time"];
const CHARACTERS = ["swordsman", "martial", "guardian", "spearman", "mage", "ranger", "assassin"];
const QUICK_CASES = [
  { power: "fire", character: "swordsman" },
  { power: "lightning", character: "ranger" },
  { power: "shadow", character: "assassin" },
  { power: "gravity", character: "spearman" },
  { power: "crystal", character: "mage" }
];

function usage() {
  return [
    "Usage: node tools/perf-matrix.js [options]",
    "",
    "Runs perf-smoke across multiple power/character combinations and summarizes the weakest cases.",
    "",
    "Options:",
    "  --preset <name>      quick, powers, characters, full; default quick",
    "  --powers <list>      Comma-separated power ids or all",
    "  --characters <list>  Comma-separated character ids or all",
    "  --mobile             Forward mobile viewport to perf-smoke",
    "  --weak-device        Forward weak-device profile to perf-smoke",
    "  --duration <sec>     Per-case duration; default 5",
    "  --cooldown <sec>     Per-case cooldown; default 1.5",
    "  --min-fps <n>        Per-case minimum FPS; default 25 mobile, 30 desktop",
    "  --max-long <n>       Per-case long-frame limit; default 35",
    "  --strict-preload     Fail if priority preload does not settle",
    "  --no-audio           Disable music/SFX during smoke runs",
    "  --json               Print compact JSON summary only",
    "  --help               Show this help"
  ].join("\n");
}

function parseArgs(argv) {
  const options = {
    preset: "quick",
    duration: 5,
    cooldown: 1.5,
    maxLong: 35
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--mobile") options.mobile = true;
    else if (arg === "--weak-device") options.weakDevice = true;
    else if (arg === "--strict-preload") options.strictPreload = true;
    else if (arg === "--no-audio") options.noAudio = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--preset") options.preset = argv[++i] || options.preset;
    else if (arg === "--powers") options.powers = argv[++i] || "";
    else if (arg === "--characters") options.characters = argv[++i] || "";
    else if (arg === "--duration") options.duration = Math.max(2, Number(argv[++i] || options.duration) || options.duration);
    else if (arg === "--cooldown") options.cooldown = Math.max(0, Number(argv[++i] || options.cooldown) || options.cooldown);
    else if (arg === "--min-fps") options.minFps = Math.max(1, Number(argv[++i] || options.minFps) || options.minFps);
    else if (arg === "--max-long") options.maxLong = Math.max(0, Number(argv[++i] || options.maxLong) || options.maxLong);
  }
  if (!Number.isFinite(options.minFps)) options.minFps = options.mobile ? 25 : 30;
  return options;
}

function listFrom(text, fallback) {
  const raw = String(text || "").trim();
  if (!raw) return fallback;
  if (raw.toLowerCase() === "all") return fallback;
  return raw.split(",").map((entry) => entry.trim()).filter(Boolean);
}

function matrixCases(options) {
  if (options.powers || options.characters) {
    const powers = listFrom(options.powers, POWERS);
    const characters = listFrom(options.characters, CHARACTERS);
    return powers.flatMap((power, index) => {
      if (options.characters) return characters.map((character) => ({ power, character }));
      return [{ power, character: characters[index % characters.length] }];
    });
  }
  if (options.preset === "quick") return QUICK_CASES;
  if (options.preset === "powers") return POWERS.map((power, index) => ({ power, character: CHARACTERS[index % CHARACTERS.length] }));
  if (options.preset === "characters") return CHARACTERS.map((character, index) => ({ power: POWERS[index % POWERS.length], character }));
  if (options.preset === "full") return POWERS.flatMap((power) => CHARACTERS.map((character) => ({ power, character })));
  throw new Error(`Unknown preset: ${options.preset}`);
}

function parseMetrics(stdout) {
  const text = String(stdout || "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  return JSON.parse(text.slice(start, end + 1));
}

function runCase(testCase, options) {
  const args = [
    perfSmoke,
    "--duration", String(options.duration),
    "--cooldown", String(options.cooldown),
    "--min-fps", String(options.minFps),
    "--max-long", String(options.maxLong),
    "--power", testCase.power,
    "--character", testCase.character
  ];
  if (options.mobile) args.push("--mobile");
  if (options.weakDevice) args.push("--weak-device");
  if (options.strictPreload) args.push("--strict-preload");
  if (options.noAudio) args.push("--no-audio");
  const run = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: Math.max(30000, Math.ceil((options.duration + 14) * 1000))
  });
  const metrics = parseMetrics(run.stdout);
  const stderr = String(run.stderr || "").trim();
  return {
    ...testCase,
    ok: run.status === 0 && Boolean(metrics),
    exitCode: run.status,
    metrics,
    stderr
  };
}

function summarize(results) {
  const completed = results.filter((entry) => entry.metrics);
  const sortedByFps = completed.slice().sort((a, b) => (a.metrics.avgFps || 0) - (b.metrics.avgFps || 0));
  const sortedByLong = completed.slice().sort((a, b) => (b.metrics.longFramePercent || 0) - (a.metrics.longFramePercent || 0));
  return {
    cases: results.length,
    passed: results.filter((entry) => entry.ok).length,
    failed: results.filter((entry) => !entry.ok).length,
    weakestFps: sortedByFps.slice(0, 5).map(compactResult),
    highestLongFrames: sortedByLong.slice(0, 5).map(compactResult),
    failures: results.filter((entry) => !entry.ok).map((entry) => ({
      power: entry.power,
      character: entry.character,
      exitCode: entry.exitCode,
      stderr: entry.stderr
    }))
  };
}

function compactResult(entry) {
  const metrics = entry.metrics || {};
  return {
    power: entry.power,
    character: entry.character,
    avgFps: metrics.avgFps,
    longFramePercent: metrics.longFramePercent,
    coreAutoLevel: metrics.coreAutoLevel,
    effectQuality: metrics.effectQuality,
    dpr: metrics.dpr,
    priorityQueuedAssets: metrics.priorityQueuedAssets,
    loadTimeouts: metrics.loadTimeouts,
    missingImages: metrics.missingImages
  };
}

function printHuman(summary, results) {
  console.log(`Perf matrix: ${summary.passed}/${summary.cases} passed.`);
  for (const result of results) {
    const metrics = result.metrics;
    if (!metrics) {
      console.log(`- FAIL ${result.power}/${result.character}: no metrics`);
      continue;
    }
    const status = result.ok ? "PASS" : "FAIL";
    console.log(`- ${status} ${result.power}/${result.character}: ${metrics.avgFps} FPS, long ${metrics.longFramePercent}%, core ${metrics.coreAutoLevel}, effect ${metrics.effectQuality}, dpr ${metrics.dpr}`);
  }
  if (summary.failed > 0) {
    console.log("Weakest FPS cases:");
    for (const item of summary.weakestFps) console.log(`  ${item.power}/${item.character}: ${item.avgFps} FPS`);
    console.log("Failures:");
    for (const failure of summary.failures) console.log(`  ${failure.power}/${failure.character}: ${failure.stderr || `exit ${failure.exitCode}`}`);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const cases = matrixCases(options);
  const results = [];
  for (const testCase of cases) {
    if (!options.json) console.log(`Running ${testCase.power}/${testCase.character}...`);
    results.push(runCase(testCase, options));
  }
  const summary = summarize(results);
  if (options.json) console.log(JSON.stringify({ summary, results: results.map((entry) => ({ ...compactResult(entry), ok: entry.ok })) }, null, 2));
  else printHuman(summary, results);
  if (summary.failed > 0) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
