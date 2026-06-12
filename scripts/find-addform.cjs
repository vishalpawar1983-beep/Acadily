const fs = require('fs');
const code = fs.readFileSync('frontend-build/static/js/main.1d1ae619.js', 'utf8');

// Find the add-form route in React Router
const patterns = [
  'add-form',
  'Add Form',
  'AddForm',
  'addForm',
  'Create New Form',
  'Enter form name',
  'Form Name',
  'formName',
  'Add Field',
  'Customized Fields',
  'Lead Source',
  'Lead Status',
  'enquiry',
  'Enquiry',
];

for (const pat of patterns) {
  let idx = 0;
  let count = 0;
  while (count < 3) {
    const found = code.indexOf(pat, idx);
    if (found === -1) break;
    // Check surrounding context
    const context = code.substring(found - 80, found + 120);
    // Only show meaningful matches (skip very common words in non-UI context)
    if (context.includes('jsx') || context.includes('children') || context.includes('path') ||
        context.includes('Route') || context.includes('className') || context.includes('component') ||
        context.includes('element')) {
      console.log(`\n=== "${pat}" at ${found} ===`);
      console.log(context);
    }
    idx = found + 1;
    count++;
  }
}

// Search for the route definition
console.log('\n\n=== Route path for add-form ===');
let idx = 0;
while (true) {
  const found = code.indexOf('add-form', idx);
  if (found === -1) break;
  const context = code.substring(found - 150, found + 100);
  if (context.includes('path') || context.includes('Route') || context.includes('element')) {
    console.log(`at ${found}: ...${context}...`);
    console.log('---');
  }
  idx = found + 1;
}
