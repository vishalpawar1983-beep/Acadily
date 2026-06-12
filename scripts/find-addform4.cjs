const fs = require('fs');
const code = fs.readFileSync('frontend-build/static/js/main.1d1ae619.js', 'utf8');

// Get the full component body from wj to the end
// wj starts at 3391393 (function wj)
// Let me get chunks of the full render

console.log('=== Chunk 1: 3393500 to 3396000 ===');
console.log(code.substring(3393500, 3396000));

console.log('\n\n=== Chunk 2: 3396000 to 3399000 ===');
console.log(code.substring(3396000, 3399000));

console.log('\n\n=== Chunk 3: 3399000 to 3402000 ===');
console.log(code.substring(3399000, 3402000));

console.log('\n\n=== Chunk 4: 3402000 to 3406000 ===');
console.log(code.substring(3402000, 3406000));
