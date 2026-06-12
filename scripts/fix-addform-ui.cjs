const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend-build', 'static', 'js', 'main.1d1ae619.js');
let code = fs.readFileSync(filePath, 'utf8');
const originalLength = code.length;

console.log('Original file length:', originalLength);

// ============================================================
// REPLACEMENT 1: Remove the first card body (form input fields)
// This removes: Name, Mobile Number, City, Email inputs + default selects
// from the first card, leaving only the header (company + form name + Create New Form)
// ============================================================

// The first card body starts with this unique pattern (comma + body div)
const firstBodyStartMarker = ',(0,cd.jsx)("div",{id:"kt_account_profile_details",className:"collapse show",children:(0,cd.jsx)("form",{children:(0,cd.jsxs)("div",{className:"card-body border-top p-9",children:[(0,cd.jsxs)("div",{className:"row",children:[(0,cd.jsx)("div",{className:"col-6",children:(0,cd.jsxs)("div",{className:"row mb-6",children:[(0,cd.jsx)("label",{className:"col-lg-4 col-form-label required fw-bold fs-6",children:"Name"})';

const firstBodyStartIdx = code.indexOf(firstBodyStartMarker);
if (firstBodyStartIdx === -1) {
  console.error('ERROR: Could not find first card body start marker');
  process.exit(1);
}
console.log('First card body start found at:', firstBodyStartIdx);

// The first card body ends just before the second card starts
// Second card: (0,cd.jsxs)("div",{className:"card mb-5 mb-xl-10",children:[(0,cd.jsx)("div",{className:"card-header border-0 cursor-pointer",children:(0,cd.jsx)("div",{className:"card-title m-0",children:(0,cd.jsx)("h3",{className:"fw-bolder m-0",children:" ".concat(
const secondCardMarker = '(0,cd.jsxs)("div",{className:"card mb-5 mb-xl-10",children:[(0,cd.jsx)("div",{className:"card-header border-0 cursor-pointer",children:(0,cd.jsx)("div",{className:"card-title m-0",children:(0,cd.jsx)("h3",{className:"fw-bolder m-0",children:" ".concat(';

const secondCardIdx = code.indexOf(secondCardMarker, firstBodyStartIdx);
if (secondCardIdx === -1) {
  console.error('ERROR: Could not find second card start marker');
  process.exit(1);
}
console.log('Second card start found at:', secondCardIdx);

// The first card body ends with ]}) before the comma that separates the two cards
// Pattern: ...BODY_END]}),(0,cd.jsxs)("div"...
// So from firstBodyStartIdx to (secondCardIdx - 5) where -5 accounts for ]}),
// Actually, let's find the exact ]}), before secondCardIdx
const transitionText = code.substring(secondCardIdx - 10, secondCardIdx);
console.log('Transition text before second card:', JSON.stringify(transitionText));

// The text should end with ]}), - the ]}) closes the first card and , separates
// So firstBodyEnd = secondCardIdx - 4 (to include just the comma before body but not the card close ]}) )
// Wait: the structure is: [HEADER,BODY]}),(0,cd.jsxs)...
// I want to remove ,BODY  (from comma to end of body)
// After removal: [HEADER]}),(0,cd.jsxs)...
// The ]}) at positions secondCardIdx-4 to secondCardIdx-2 close the first card
// The , at secondCardIdx-1 separates first and second cards

// Find the ]}) before the second card
// From secondCardIdx, go back to find ]}),
let firstBodyEndIdx = secondCardIdx;
// The pattern is: ...BODY_CONTENT]}),(0,cd.jsxs)...
// ]}) closes the first card div children array + div props + jsx call
// , separates the two cards in the Fragment's children array

// Go back from secondCardIdx to find where the BODY ends
// secondCardIdx points to: (0,cd.jsxs)("div",...
// Before that is: ,
// Before that is: })  - close first card jsx
// Before that is: ]   - close first card children array
// Before that is: BODY content end

// So: ...BODY_END  ]  }  )  ,  (0,cd.jsxs)...
//     ...         -4 -3 -2 -1  secondCardIdx

// I want to remove from firstBodyStartIdx (the ,BODY part) up to but not including secondCardIdx - 4
// After removal: ...[HEADER]}),(0,cd.jsxs)...

firstBodyEndIdx = secondCardIdx - 4; // position of ] that closes first card children
// But wait, the ] closes the children array. Before that is the end of BODY.
// So I remove from firstBodyStartIdx to firstBodyEndIdx (exclusive)

const firstBodyToRemove = code.substring(firstBodyStartIdx, firstBodyEndIdx);
console.log('\nFirst card body to remove:');
console.log('  Length:', firstBodyToRemove.length);
console.log('  Starts with:', firstBodyToRemove.substring(0, 60));
console.log('  Ends with:', firstBodyToRemove.substring(firstBodyToRemove.length - 60));

// Verify it starts with comma and ends properly
if (!firstBodyToRemove.startsWith(',(0,cd.jsx)("div",{id:"kt_account_profile_details"')) {
  console.error('ERROR: First body start mismatch');
  process.exit(1);
}

// Remove the first card body
code = code.substring(0, firstBodyStartIdx) + code.substring(firstBodyEndIdx);
console.log('\nAfter removing first card body, file length:', code.length);
console.log('Removed', originalLength - code.length, 'chars');

// ============================================================
// REPLACEMENT 2: Replace second card custom fields body with TABLE
// ============================================================

// After removal, positions shifted. Find the second card body again.
const newSecondCardBodyMarker = '(0,cd.jsx)("div",{className:"card-body border-top p-9",children:(0,cd.jsx)("form",{children:(0,cd.jsx)("div",{className:"row",children:null===(s=_.data)';
const secondBodyStartIdx = code.indexOf(newSecondCardBodyMarker);
if (secondBodyStartIdx === -1) {
  console.error('ERROR: Could not find second card body marker after first replacement');
  process.exit(1);
}
console.log('\nSecond card body found at:', secondBodyStartIdx);

// Find the end of the second card body - it ends before the card-footer
const footerMarker = ',(0,cd.jsx)("div",{className:"card card-footer"';
const footerIdx = code.indexOf(footerMarker, secondBodyStartIdx);
if (footerIdx === -1) {
  console.error('ERROR: Could not find footer marker');
  process.exit(1);
}
console.log('Footer found at:', footerIdx);

const secondBodyToReplace = code.substring(secondBodyStartIdx, footerIdx);
console.log('\nSecond card body to replace:');
console.log('  Length:', secondBodyToReplace.length);
console.log('  Starts with:', secondBodyToReplace.substring(0, 80));
console.log('  Ends with:', secondBodyToReplace.substring(secondBodyToReplace.length - 60));

// Build the TABLE replacement
const tableReplacement = `(0,cd.jsx)("div",{className:"card-body border-top p-9",children:(0,cd.jsx)("div",{className:"table-responsive",children:(0,cd.jsxs)("table",{className:"table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer",children:[(0,cd.jsx)("thead",{children:(0,cd.jsxs)("tr",{className:"text-start text-muted fw-bolder fs-7 text-uppercase gs-0",children:[(0,cd.jsx)("th",{className:"w-10px pe-2",children:(0,cd.jsx)("div",{className:"form-check form-check-sm form-check-custom form-check-solid me-3",children:(0,cd.jsx)("input",{className:"form-check-input",type:"checkbox"})})}),(0,cd.jsx)("th",{className:"min-w-125px",children:"Field Name"}),(0,cd.jsx)("th",{className:"min-w-125px",children:"Type"}),(0,cd.jsx)("th",{className:"min-w-125px",children:"Mandatory"}),(0,cd.jsx)("th",{className:"min-w-125px",children:"Option"}),(0,cd.jsx)("th",{className:"text-end min-w-100px",children:"Actions"})]})}),(0,cd.jsxs)("tbody",{className:"text-gray-600 fw-bold",children:[null===U||void 0===U?void 0:U.map(function(e,t){return(0,cd.jsxs)("tr",{children:[(0,cd.jsx)("td",{children:(0,cd.jsx)("div",{className:"form-check form-check-sm form-check-custom form-check-solid",children:(0,cd.jsx)("input",{className:"form-check-input",type:"checkbox"})})}),(0,cd.jsx)("td",{children:(0,cd.jsx)("span",{className:"text-dark fw-bold text-hover-primary d-block fs-6",children:null===e||void 0===e?void 0:e.selectName})}),(0,cd.jsx)("td",{children:(0,cd.jsx)("span",{className:"badge badge-light-info",children:"Select"})}),(0,cd.jsx)("td",{children:(0,cd.jsx)("span",{className:"badge badge-light-warning",children:"-"})}),(0,cd.jsx)("td",{children:null===e||void 0===e?void 0:e.options.map(function(e){return e.label}).join(", ")}),(0,cd.jsx)("td",{className:"text-end",children:(0,cd.jsx)("a",{className:"btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1",onClick:function(){d("select"),l(e),E(!0)},children:(0,cd.jsx)(vd.D9,{iconName:"pencil",className:"fs-3"})})})]},\"sel-\"+t)}),null===(s=_.data)||void 0===s?void 0:s.filter(function(e){var t;return null===(t=e.formId)||void 0===t?void 0:t.includes(q)}).map(function(e,t){return(0,cd.jsxs)("tr",{children:[(0,cd.jsx)("td",{children:(0,cd.jsx)("div",{className:"form-check form-check-sm form-check-custom form-check-solid",children:(0,cd.jsx)("input",{className:"form-check-input",type:"checkbox"})})}),(0,cd.jsx)("td",{children:(0,cd.jsx)("span",{className:"text-dark fw-bold text-hover-primary d-block fs-6",children:e.name})}),(0,cd.jsx)("td",{children:(0,cd.jsx)("span",{className:"badge badge-light-info",children:e.type})}),(0,cd.jsx)("td",{children:!0===e.mandatory?(0,cd.jsx)("span",{className:"badge badge-light-success",children:"Yes"}):(0,cd.jsx)("span",{className:"badge badge-light-danger",children:"No"})}),(0,cd.jsx)("td",{children:e.options&&e.options.length>0?e.options.map(function(e){return e.label}).join(", "):"-"}),(0,cd.jsx)("td",{className:"text-end",children:(0,cd.jsxs)("div",{className:"d-flex justify-content-end flex-shrink-0",children:[(0,cd.jsx)("a",{className:"btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1",onClick:function(){return k(e)},children:(0,cd.jsx)(vd.D9,{iconName:"pencil",className:"fs-3"})}),(0,cd.jsx)("a",{className:"btn btn-icon btn-bg-light btn-active-color-danger btn-sm",onClick:function(){return j(e._id)},children:(0,cd.jsx)(vd.D9,{iconName:"trash",className:"fs-3"})})]})})]},t)})]})]})})})`;

console.log('\nTable replacement length:', tableReplacement.length);

// Perform the replacement
code = code.substring(0, secondBodyStartIdx) + tableReplacement + code.substring(footerIdx);

console.log('\nFinal file length:', code.length);
console.log('Total change:', code.length - originalLength, 'chars');

// Write the modified file
fs.writeFileSync(filePath, code);
console.log('\nFile written successfully!');

// Verify the change
const verifyCode = fs.readFileSync(filePath, 'utf8');
console.log('Verified file length:', verifyCode.length);

// Check that both components still exist
const wjCheck = verifyCode.indexOf('function wj()');
const njCheck = verifyCode.indexOf('function Nj()');
console.log('wj component at:', wjCheck);
console.log('Nj component at:', njCheck);

// Check table exists
const tableCheck = verifyCode.indexOf('table align-middle table-row-dashed', wjCheck);
console.log('Table element at:', tableCheck);

// Check card-footer still exists
const footerCheck = verifyCode.indexOf('card card-footer', wjCheck);
console.log('Card footer at:', footerCheck);

// Check Create New Form button still exists
const createCheck = verifyCode.indexOf('Create New Form', wjCheck);
console.log('Create New Form at:', createCheck);

// Check Add Field button still exists
const addFieldCheck = verifyCode.indexOf('Add Field', footerCheck);
console.log('Add Field button at:', addFieldCheck);
