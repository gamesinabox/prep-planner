// Self-check: every recipe ingredient exists, and per-portion macros vs the recipe bank table.
// Run: node check.js
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/app.html', 'utf8');
const data = html.split('/*DATA*/')[1].split('/*END*/')[0];
const { ING, RECIPES, BF, macros } = new Function(data + ';return {ING,RECIPES,BF,macros}')();
const assert = require('assert');

// Recipe bank table (High_Protein_Recipe_Bank.md), per portion: kcal, P, C, F
const BANK = {1:[725,61,79,17],2:[622,58,72,9],3:[752,61,87,17],4:[657,62,67,14],5:[647,60,74,11],6:[652,59,75,11],
 7:[784,63,88,20],8:[659,56,72,14],9:[666,54,75,14],10:[670,55,70,18],11:[684,58,72,16],12:[590,55,60,14],13:[704,50,80,21],
 14:[735,52,77,25],15:[730,33,87,29],16:[627,51,87,10],17:[683,46,55,31],18:[703,43,76,28],19:[721,52,72,29],20:[637,47,70,17],
 21:[668,61,66,18],22:[613,59,73,12],23:[657,64,53,22],24:[715,53,65,28],25:[710,61,44,38]};

for (const r of [...RECIPES, ...Object.values(BF)])
  for (const k in r.ing) assert(ING[k], `${r.n}: unknown ingredient ${k}`);
for (const k in ING) { const d = ING[k]; // catches typos; veg/spice carbs include fibre so 4/4/9 runs high there
  const e = d[3] * 4 + d[4] * 4 + d[5] * 9; assert(Math.abs(e - d[2]) <= Math.max(15, d[2] * 0.3), `${k}: kcal ${d[2]} vs macro energy ${e.toFixed(0)}`); }

let worst = 0;
console.log('id  name                                   app kcal/P/C/F        bank kcal/P/C/F   dKcal');
for (const r of RECIPES) {
  const m = macros(r.ing).map(x => Math.round(x / r.s)), b = BANK[r.id], dk = m[0] - b[0];
  worst = Math.max(worst, Math.abs(dk) / b[0]);
  console.log(String(r.id).padEnd(4) + r.n.padEnd(39) + m.join('/').padEnd(22) + b.join('/').padEnd(18) + dk);
}
console.log('worst kcal gap vs bank: ' + (worst * 100).toFixed(1) + '%');
assert(worst < 0.08, 'a recipe drifts more than 8% from the bank');
console.log('OK');
