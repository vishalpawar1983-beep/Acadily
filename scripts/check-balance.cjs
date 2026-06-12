const fs = require('fs');
const code = fs.readFileSync('frontend-build/static/js/main.1d1ae619.js', 'utf8');

const wjStart = code.indexOf('function wj()');
const njStart = code.indexOf('function Nj()');
const wjComponent = code.substring(wjStart, njStart);

let parens = 0, brackets = 0, braces = 0;
let inString = false, stringChar = '';
let escaped = false;

for (let i = 0; i < wjComponent.length; i++) {
  const ch = wjComponent[i];

  if (escaped) { escaped = false; continue; }
  if (ch === '\\') { escaped = true; continue; }

  if (inString) {
    if (ch === stringChar) inString = false;
    continue;
  }

  if (ch === '"' || ch === "'" || ch === '`') {
    inString = true;
    stringChar = ch;
    continue;
  }

  if (ch === '(') parens++;
  if (ch === ')') parens--;
  if (ch === '[') brackets++;
  if (ch === ']') brackets--;
  if (ch === '{') braces++;
  if (ch === '}') braces--;
}

console.log('Bracket balance for wj component:');
console.log('Parentheses:', parens, parens === 0 ? 'OK' : 'MISMATCH');
console.log('Brackets:', brackets, brackets === 0 ? 'OK' : 'MISMATCH');
console.log('Braces:', braces, braces === 0 ? 'OK' : 'MISMATCH');
console.log('Component length:', wjComponent.length);
