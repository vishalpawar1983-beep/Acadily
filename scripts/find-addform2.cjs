const fs = require('fs');
const code = fs.readFileSync('frontend-build/static/js/main.1d1ae619.js', 'utf8');

// Find the route definition for /add-form/:id -> wj component
// Let me find wj component definition
const routeStr = 'path:"/add-form/:id",element:(0,cd.jsx)(wj,{})';
const routeIdx = code.indexOf(routeStr);
console.log('Route at:', routeIdx);

// Also find the update-form route
const updateRouteStr = 'path:"/update-form/:id"';
const updateRouteIdx = code.indexOf(updateRouteStr);
console.log('Update route at:', updateRouteIdx);
console.log(code.substring(updateRouteIdx - 10, updateRouteIdx + 200));

// Find where wj is defined - search backwards from usage
// In minified code, wj should be defined as: const wj = ... or wj = ...
// Let me search for ",wj=" or "const wj=" or similar
let searchPatterns = ['wj=()=>', 'wj=e=>', 'wj=(', 'wj=function', ',wj='];
for (const pat of searchPatterns) {
  const idx = code.indexOf(pat);
  if (idx > -1) {
    console.log(`\n=== "${pat}" found at ${idx} ===`);
    console.log(code.substring(idx - 20, idx + 500));
    break;
  }
}

// The component around 3393371 seems to be the add-form component
// Let me get more context around it to find its definition
console.log('\n\n=== Add-form component area (3392800 to 3393600) ===');
console.log(code.substring(3392800, 3393600));

// Also get the "Create New Form" button area and form listing (3394700 to 3395500)
console.log('\n\n=== Create form button + listing (3394700 to 3396000) ===');
console.log(code.substring(3394700, 3396000));
