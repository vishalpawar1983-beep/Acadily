'use strict';
const fs = require('fs');
const filePath = 'e:/ims full stack/ims-fullstack/frontend-build/static/js/main.1d1ae619.js';
let content = fs.readFileSync(filePath, 'utf8');

const original = content;

// 1. Replace the 3 Counsellor conditions to also exclude Trainer
const counsellorPattern = '"Counsellor"!==(null===h||void 0===h?void 0:h.role)';
const counsellorReplacement = '"Counsellor"!==(null===h||void 0===h?void 0:h.role)&&"Trainer"!==(null===h||void 0===h?void 0:h.role)';

let count = 0;
while (content.includes(counsellorPattern)) {
  content = content.replace(counsellorPattern, counsellorReplacement);
  count++;
}
console.log('Replaced ' + count + ' Counsellor conditions');

// 2. Add Trainer to company display condition, and exclude Trainer from the catch-all
const companyOld = '"Company"===(null===h||void 0===h?void 0:h.role)&&e._id===(null===h||void 0===h?void 0:h.companyId)||"SuperAdmin"!==(null===h||void 0===h?void 0:h.role)&&"Company"!==(null===h||void 0===h?void 0:h.role)&&';
const companyNew = '"Company"===(null===h||void 0===h?void 0:h.role)&&e._id===(null===h||void 0===h?void 0:h.companyId)||"Trainer"===(null===h||void 0===h?void 0:h.role)&&e._id===(null===h||void 0===h?void 0:h.companyId)||"SuperAdmin"!==(null===h||void 0===h?void 0:h.role)&&"Company"!==(null===h||void 0===h?void 0:h.role)&&"Trainer"!==(null===h||void 0===h?void 0:h.role)&&';

if (content.includes(companyOld)) {
  content = content.replace(companyOld, companyNew);
  console.log('Replaced company display condition');
} else {
  console.log('ERROR: company display condition not found!');
}

if (content === original) {
  console.log('ERROR: No changes made!');
} else {
  fs.writeFileSync(filePath, content);
  console.log('File written successfully');
}
