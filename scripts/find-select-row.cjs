const fs = require('fs');
const code = fs.readFileSync('frontend-build/static/js/main.1d1ae619.js', 'utf8');

const selectRowStart = 3396865;

// The row starts with (0,cd.jsx)("div",{className:"row",...
// I need to find where this call closes (matching parenthesis)
const textFromSelect = code.substring(selectRowStart, selectRowStart + 1200);

let depth = 0;
let endIdx = -1;
let inStr = false, strCh = '';

for (let i = 0; i < textFromSelect.length; i++) {
  const ch = textFromSelect[i];
  if (inStr) {
    if (ch === '\\' && i + 1 < textFromSelect.length) { i++; continue; }
    if (ch === strCh) inStr = false;
    continue;
  }
  if (ch === '"' || ch === "'") { inStr = true; strCh = ch; continue; }
  if (ch === '(') depth++;
  if (ch === ')') { depth--; if (depth === 0) { endIdx = i; break; } }
}

console.log('Row div closes at offset:', endIdx);
const selectRowEnd = selectRowStart + endIdx + 1;
console.log('Absolute end position:', selectRowEnd);
console.log('Select row length:', selectRowEnd - selectRowStart);

// Show what we're removing
console.log('\nStarts with:', textFromSelect.substring(0, 80));
console.log('Ends with:', code.substring(selectRowEnd - 40, selectRowEnd));

// Show what comes before and after
console.log('\nBefore (5 chars):', JSON.stringify(code.substring(selectRowStart - 5, selectRowStart)));
console.log('After (30 chars):', JSON.stringify(code.substring(selectRowEnd, selectRowEnd + 30)));

// The select row is inside the card-body children array:
// children:[ ROW1, ROW2, SELECT_ROW ]
// So before it there should be a comma: ,
// I need to also remove the comma before it

// Check: the text before selectRowStart is "]}),"
// The comma is at selectRowStart - 1
console.log('\nChar before select row:', JSON.stringify(code[selectRowStart - 1]));
