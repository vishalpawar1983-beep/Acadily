const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend-build', 'static', 'js', 'main.1d1ae619.js');
let code = fs.readFileSync(filePath, 'utf8');
const originalLength = code.length;
console.log('Original file length:', originalLength);

// Find the default selects row in the wj component
// It's a <div className="row"> that renders U.map() with Lead Source/Lead Status selects
// This row comes right after the Email row in the first card body

// Unique marker for the start: comma + the row div with U map
const selectRowMarker = ',(0,cd.jsx)("div",{className:"row",children:null===U||void 0===U?void 0:U.map(e=>(0,cd.jsx)("div",{className:"col-6"';
const startIdx = code.indexOf(selectRowMarker);
if (startIdx === -1) {
  console.error('ERROR: Could not find select row marker');
  process.exit(1);
}
console.log('Select row comma starts at:', startIdx);

// Now find where this row div closes
// The row structure: (0,cd.jsx)("div",{className:"row",children:U.map(...)})
// After the row closes, the next char should be ] closing the card-body children array
// The marker for that is: ]})})}) which closes card-body, form, collapse div

// Find the closing sequence after the row
// The row ends with: e._id))}) where }) closes the row div props+call
// Then ] starts the card-body children close

// Search for the specific end pattern: the closing of the row followed by card-body close
const endPattern = ')]})]})})})';
const endSearchStart = startIdx + selectRowMarker.length;
const endIdx = code.indexOf(endPattern, endSearchStart);
if (endIdx === -1) {
  console.error('ERROR: Could not find end pattern');
  // Try alternative pattern
  const alt = ']})})})';
  const altIdx = code.indexOf(alt, endSearchStart);
  console.log('Alternative pattern found at:', altIdx);
  console.log('Context:', code.substring(altIdx - 30, altIdx + 20));
  process.exit(1);
}

// The row ends right before the ] in ]})})})
// endPattern starts with ) which is part of the inner content
// ]}) is card-body close, })}) is form+collapse close
// Let me find the ] that starts the card-body children close

// Actually, let me find the exact position where the row call closes
// After the row map, the closing is: e._id))})
// Then ]})})}) closes card-body, form, collapse div

// The ]})})}) pattern - search for it
const closingPattern = ']})})})';
const closingIdx = code.indexOf(closingPattern, endSearchStart);
console.log('Closing pattern ]})})}) found at:', closingIdx);
console.log('Context before:', code.substring(closingIdx - 20, closingIdx));
console.log('Context after:', code.substring(closingIdx, closingIdx + 30));

// The row ends right before the ] at closingIdx
// So the text to remove is from startIdx to closingIdx
const textToRemove = code.substring(startIdx, closingIdx);
console.log('\nText to remove:');
console.log('  Length:', textToRemove.length);
console.log('  Starts with:', textToRemove.substring(0, 80));
console.log('  Ends with:', textToRemove.substring(textToRemove.length - 60));

// Verify: after removal, the card-body children should close properly
// Before: [ROW1, ROW2, SELECT_ROW]})})})
// After:  [ROW1, ROW2]})})})
const afterRemoval = code.substring(closingIdx, closingIdx + 20);
console.log('\nAfter removal, next chars:', afterRemoval);

// Perform the removal
code = code.substring(0, startIdx) + code.substring(closingIdx);
console.log('\nNew file length:', code.length);
console.log('Removed', originalLength - code.length, 'chars');

// Write the file
fs.writeFileSync(filePath, code);
console.log('File written successfully!');

// Verify
const verify = fs.readFileSync(filePath, 'utf8');
const wjStart = verify.indexOf('function wj()');
const njStart = verify.indexOf('function Nj()');
console.log('\nVerification:');
console.log('wj at:', wjStart);
console.log('Nj at:', njStart);
console.log('Create New Form:', verify.indexOf('Create New Form', wjStart) > 0 ? 'PRESENT' : 'MISSING');
console.log('Add Field:', verify.indexOf('Add Field', wjStart) > 0 ? 'PRESENT' : 'MISSING');
console.log('Customized Fields:', verify.indexOf('Customized Fields', wjStart) > 0 ? 'PRESENT' : 'MISSING');
console.log('Name input:', verify.indexOf('placeholder:"Name"', wjStart) > 0 ? 'PRESENT' : 'MISSING');
console.log('Mobile Number:', verify.indexOf('placeholder:"Mobile Number"', wjStart) > 0 ? 'PRESENT' : 'MISSING');
console.log('City:', verify.indexOf('placeholder:"City"', wjStart) > 0 ? 'PRESENT' : 'MISSING');
console.log('Email:', verify.indexOf('placeholder:"Email"', wjStart) > 0 ? 'PRESENT' : 'MISSING');
console.log('Edit field (k):', verify.indexOf('k(e)', wjStart) > 0 ? 'PRESENT' : 'MISSING');
console.log('Delete field (j):', verify.indexOf('j(e._id)', wjStart) > 0 ? 'PRESENT' : 'MISSING');

// Check the lead source/status selects are GONE
console.log('Default selects (U.map):', verify.indexOf('U.map', wjStart) > 0 ? 'STILL PRESENT (BAD)' : 'REMOVED (GOOD)');
