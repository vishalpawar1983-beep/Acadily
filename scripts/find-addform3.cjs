const fs = require('fs');
const code = fs.readFileSync('frontend-build/static/js/main.1d1ae619.js', 'utf8');

// I need to see both the form list and the form creation/editing part
// The second screenshot shows a form builder with:
// - "Customized Fields" section with a table: checkbox, field name, type, mandatory, option, action
// - "Add Field" button
// - "Save" button

// Let me get the full component starting from around 3393000
// which is the beginning of the component rendering

// First, find the component boundary
// The component starts with the state hooks before the return statement
// Let me search for the component definition that contains "Create New Form"

// Get a large chunk covering the full component
console.log('=== Component chunk 1 (3391000 to 3393500) - State & hooks ===');
console.log(code.substring(3391000, 3393500));
