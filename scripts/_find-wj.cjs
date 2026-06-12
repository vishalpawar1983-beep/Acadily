const fs = require('fs');
const content = fs.readFileSync('e:/ims full stack/ims-fullstack/frontend-build/static/js/main.1d1ae619.js', 'utf8');

// Find (wj,{}) usage
const useIdx = content.indexOf('(wj,{})');
console.log('(wj,{}) at:', useIdx);

// Search backwards
const searchFrom = Math.max(0, useIdx - 100000);
const chunk = content.slice(searchFrom, useIdx);

// Look for wj definition
const re = /(?:function |[,; ])wj(?:\s*=|\s*\()/g;
let m;
let lastMatch = null;
while ((m = re.exec(chunk)) !== null) {
  lastMatch = {idx: searchFrom + m.index, text: chunk.slice(m.index, m.index + 200)};
}
if (lastMatch) {
  console.log('Definition at:', lastMatch.idx);
  console.log(lastMatch.text);
} else {
  console.log('No definition found in 100k before usage');
  // Try broader search
  const allIdx = content.indexOf('function wj(');
  console.log('function wj( at:', allIdx);
  const allIdx2 = content.indexOf('function wj ');
  console.log('function wj  at:', allIdx2);

  // Search all occurrences of wj=
  let pos = 0;
  while (true) {
    pos = content.indexOf('wj=', pos);
    if (pos === -1) break;
    const ch = content[pos-1];
    if (ch === ',' || ch === ';' || ch === ' ' || ch === '{' || ch === '(') {
      console.log('wj= at', pos, ':', content.slice(pos, pos+150));
    }
    pos++;
  }
}
