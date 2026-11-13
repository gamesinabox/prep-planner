// Self-check: every recipe ingredient exists, and per-portion macros vs the recipe bank table.
// Run: node check.js
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/app.html', 'utf8');
const data = html.split('/*DATA*/')[1].split('/*END*/')[0];
const { ING, RECIPES, BF, macros } = new Function(data + ';return {ING,RECIPES,BF,macros}')();
const assert = require('assert');

// Recipe bank table (High_Protein_Recipe_Bank.md), per portion: kcal, P, C, F
const BANK = {}; // every recipe is now a published one; the old bank comparison no longer applies

const { IMG } = new Function(data + ';return {IMG}')();
for (const r of [...RECIPES, ...Object.values(BF)]) assert(r.src, r.n + ': no source');
for (const r of [...RECIPES, ...Object.entries(BF).map(([id, b]) => ({ ...b, id }))]) assert(IMG[r.id] || !r.src[1], r.n + ': published recipe with no photo'); // TikTok recipes (no link) use your own photo
for (const r of [...RECIPES, ...Object.values(BF)])
  for (const k in r.ing) assert(ING[k], `${r.n}: unknown ingredient ${k}`);
for (const k in ING) { const d = ING[k]; // catches typos; veg/spice carbs include fibre so 4/4/9 runs high there
  const e = d[3] * 4 + d[4] * 4 + d[5] * 9; assert(Math.abs(e - d[2]) <= Math.max(15, d[2] * 0.3), `${k}: kcal ${d[2]} vs macro energy ${e.toFixed(0)}`); }

let worst = 0;
console.log('id  name                                   app kcal/P/C/F        bank kcal/P/C/F   dKcal');
for (const r of RECIPES) {
  const m = macros(r.ing).map(x => Math.round(x / r.s)), b = BANK[r.id];
  if (!b) { // published recipes added later: no bank figure, so check they are big, high-protein meals with a source
    assert(r.src && m[0] >= 400 && m[0] <= 800 && m[1] >= 40, `${r.n}: ${m.join('/')} outside 400-800 kcal / 40 g+ protein, or no source`);
    console.log(String(r.id).padEnd(4) + r.n.padEnd(39) + m.join('/').padEnd(22) + r.src[0]); continue; }
  const dk = m[0] - b[0];
  worst = Math.max(worst, Math.abs(dk) / b[0]);
  console.log(String(r.id).padEnd(4) + r.n.padEnd(39) + m.join('/').padEnd(22) + b.join('/').padEnd(18) + dk);
}
console.log('worst kcal gap vs bank: ' + (worst * 100).toFixed(1) + '%');
assert(worst < 0.08, 'a recipe drifts more than 8% from the bank');
console.log('OK');
