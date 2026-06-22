const fs = require('fs');
let c = fs.readFileSync('src/game.js', 'utf8');

// 1. Replace: ctx.shadowBlur = lowDetail ? 0 : 4; -> ctx.shadowBlur = 0;
c = c.replace(/ctx\.shadowBlur\s*=\s*lowDetail\s*\?\s*0\s*:\s*4/g, 'ctx.shadowBlur = 0');

// 2. Replace: ctx.shadowBlur = lowDetail ? 0 : this.glow(...) -> ctx.shadowBlur = 0
c = c.replace(/ctx\.shadowBlur\s*=\s*lowDetail\s*\?\s*0\s*:\s*this\.glow\([^)]*\)/g, 'ctx.shadowBlur = 0');

// 3. Force fastVisualMode() to always return true in-game for pixel-style simplified rendering
c = c.replace(
  /fastVisualMode\(\)\s*\{[\s\S]*?if\s*\(!this\.run\s*\|\|\s*this\.mode\s*!==\s*"game"\)\s*return\s*false;[\s\S]*?return\s+this\.performancePanic\(\)[\s\S]*?\n\s*\}/,
  `fastVisualMode() {\n      // Pixel-style: always use fast visual mode for crisp, lightweight rendering\n      return this.run && this.mode === "game";\n    }`
);

// Verify
const lighterCount = (c.match(/"lighter"/g) || []).length;
const screenBlend = (c.match(/globalCompositeOperation[^;]*"screen"/g) || []).length;
const nonZeroShadowBlur = (c.match(/shadowBlur\s*=\s*(?!0\b|this\.glow)[^;]+/g) || []);
console.log('Remaining "lighter":', lighterCount);
console.log('Remaining blend "screen":', screenBlend);
console.log('Non-zero shadowBlur (not via glow):', nonZeroShadowBlur.length);
if (nonZeroShadowBlur.length) {
  nonZeroShadowBlur.forEach(m => console.log('  ', m.trim()));
}

// Check fastVisualMode was replaced
const fvmMatch = c.match(/fastVisualMode\(\)\s*\{[^}]+\}/);
if (fvmMatch) console.log('fastVisualMode:', fvmMatch[0].substring(0, 120));

fs.writeFileSync('src/game.js', c, 'utf8');
console.log('All pixel-style fixes applied.');