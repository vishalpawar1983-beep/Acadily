const fs = require('fs');

const localCode = fs.readFileSync('frontend-build/static/js/main.1d1ae619.js', 'utf8');
const vpsCode = fs.readFileSync('scripts/vps-bundle.js', 'utf8');

// Find wj component in both bundles
const localWjStart = localCode.indexOf('function wj()');
const vpsWjStart = vpsCode.indexOf('function wj()');

console.log('Local wj at:', localWjStart);
console.log('VPS wj at:', vpsWjStart);

if (vpsWjStart === -1) {
  console.log('wj not found in VPS bundle, searching for add-form component...');

  // Search for Create New Form
  const createNew = vpsCode.indexOf('Create New Form');
  console.log('Create New Form at:', createNew);

  // Search for Customized Fields
  const customFields = vpsCode.indexOf('Customized Fields');
  console.log('Customized Fields at:', customFields);

  // Search for add-form route
  const addForm = vpsCode.indexOf('add-form');
  console.log('add-form at:', addForm);
  if (addForm > -1) {
    console.log('Context:', vpsCode.substring(addForm - 100, addForm + 200));
  }

  // The component name might be different. Let's find it from route
  const routePattern = 'path:"/add-form/:id"';
  const routeIdx = vpsCode.indexOf(routePattern);
  console.log('\nRoute pattern at:', routeIdx);
  if (routeIdx > -1) {
    console.log('Route context:', vpsCode.substring(routeIdx - 20, routeIdx + 200));
  }
} else {
  // Find end of wj in both
  const localNjStart = localCode.indexOf('function Nj()', localWjStart + 100);
  const vpsNjStart = vpsCode.indexOf('function Nj()', vpsWjStart + 100);

  console.log('Local wj length:', localNjStart - localWjStart);
  console.log('VPS wj length:', vpsNjStart - vpsWjStart);

  const localWj = localCode.substring(localWjStart, localNjStart);
  const vpsWj = vpsCode.substring(vpsWjStart, vpsNjStart);

  // Check for key differences
  console.log('\n=== Key differences ===');
  console.log('Local has U.map:', localWj.includes('U.map'));
  console.log('VPS has U.map:', vpsWj.includes('U.map'));

  console.log('Local has Lead Source:', localWj.includes('Lead Source'));
  console.log('VPS has Lead Source:', vpsWj.includes('Lead Source'));

  console.log('Local has selectName:', localWj.includes('selectName'));
  console.log('VPS has selectName:', vpsWj.includes('selectName'));

  console.log('Local has Select-an-Option:', localWj.includes('Select-an-Option'));
  console.log('VPS has Select-an-Option:', vpsWj.includes('Select-an-Option'));

  // Show the VPS component for comparison
  console.log('\n=== VPS wj component (first 3000 chars) ===');
  console.log(vpsWj.substring(0, 3000));
}
