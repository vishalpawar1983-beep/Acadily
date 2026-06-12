const fs = require('fs');
const vpsCode = fs.readFileSync('scripts/vps-bundle.js', 'utf8');

// Find sy component - search for pattern: sy= or function sy
let syStart = -1;
const patterns = [',sy=', 'function sy()', 'function sy('];
for (const p of patterns) {
  const idx = vpsCode.indexOf(p);
  if (idx > -1) {
    console.log(`Found "${p}" at ${idx}`);
    syStart = idx;
    break;
  }
}

if (syStart === -1) {
  console.log('sy not found by simple patterns. Looking near Create New Form...');
  const createNew = vpsCode.indexOf('Create New Form');
  // Go backwards to find the function definition
  const chunk = vpsCode.substring(createNew - 5000, createNew);
  // Find the last "function " before Create New Form
  let lastFunc = -1;
  let searchFrom = 0;
  while (true) {
    const idx = chunk.indexOf('function ', searchFrom);
    if (idx === -1) break;
    lastFunc = idx;
    searchFrom = idx + 1;
  }
  if (lastFunc > -1) {
    syStart = createNew - 5000 + lastFunc;
    console.log('Found function at:', syStart);
    console.log('Function name:', vpsCode.substring(syStart, syStart + 50));
  }
}

// Find the next function after sy (equivalent of Nj)
const nextFunc = vpsCode.indexOf('function ay(', syStart + 100);
console.log('Next function (ay) at:', nextFunc);

const syComponent = vpsCode.substring(syStart, nextFunc);
console.log('VPS add-form component length:', syComponent.length);

// Check key features
console.log('\n=== Feature check ===');
console.log('Has U.map:', syComponent.includes('U.map'));
console.log('Has selectName:', syComponent.includes('selectName'));
console.log('Has Select-an-Option:', syComponent.includes('Select-an-Option'));
console.log('Has "Name" input:', syComponent.includes('placeholder:"Name"'));
console.log('Has Mobile Number:', syComponent.includes('Mobile Number'));
console.log('Has City:', syComponent.includes('City'));
console.log('Has Email:', syComponent.includes('Email'));
console.log('Has Customized Fields:', syComponent.includes('Customized Fields'));
console.log('Has Add Field:', syComponent.includes('Add Field'));
console.log('Has Create New Form:', syComponent.includes('Create New Form'));

// Show the full component
console.log('\n=== VPS add-form component (full) ===');
console.log(syComponent);
