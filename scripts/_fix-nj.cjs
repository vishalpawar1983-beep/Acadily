const fs = require('fs');
const acorn = require('acorn');

const bundlePath = 'e:/ims full stack/ims-fullstack/frontend-build/static/js/main.1d1ae619.js';
let content = fs.readFileSync(bundlePath, 'utf8');

// Read the broken newNj from the previous patch script
const patchScript = fs.readFileSync('e:/ims full stack/ims-fullstack/scripts/_patch-nj.cjs', 'utf8');
const patchLines = patchScript.split('\n');
const brokenNj = patchLines[5].slice("const newNj = '".length, -3);

// Apply 3 fixes to get the correct Nj (right-to-left to preserve indices):
let fixedNj = brokenNj;
// Step 1: Remove extra ) at position 6068
fixedNj = fixedNj.slice(0, 6068) + fixedNj.slice(6069);
// Step 2: Swap ) and } at positions 6066,6067 (fix nesting order)
const arr = fixedNj.split('');
[arr[6066], arr[6067]] = [arr[6067], arr[6066]];
fixedNj = arr.join('');
// Step 3: Remove extra ) at position 3605 (premature Fragment close)
fixedNj = fixedNj.slice(0, 3605) + fixedNj.slice(3606);

// Validate with acorn
try {
  acorn.parse(fixedNj, { ecmaVersion: 2020 });
  console.log('fixedNj: VALID');
} catch(e) {
  console.error('fixedNj INVALID:', e.message);
  process.exit(1);
}

if (content.includes(brokenNj)) {
  content = content.replace(brokenNj, fixedNj);
  fs.writeFileSync(bundlePath, content);
  console.log('Done! Bundle updated with fixed Nj.');
} else {
  console.log('ERROR: Broken Nj pattern not found in bundle');
  process.exit(1);
}
