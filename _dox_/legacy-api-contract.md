# Legacy Frontend API Contract

Captured from prod HAR (66.116.207.89:3000) on 2026-03-19.
This is the exact response format the frontend expects from each endpoint.

## Auth

### POST /api/users/auth
Login (via OTP flow on prod, direct on dev)
```json
{ "success": true, "message": "Login successful!", "_id": "...", "first_name": "...", "role": "Admin", "email": "...", "api_token": "JWT...", "expiresAt": 1773933663862, "last_name": "...", "email_verified_at": "...", "updated_at": "..." }
```

### POST /api/users/verifyToken
Validate stored JWT, return user profile
```json
{ "id": "...", "first_name": "...", "last_name": "...", "email": "...", "email_verified_at": "...", "created_at": "...", "updated_at": "...", "role": "Admin", "studentId": null, "api_token": "JWT..." }
```

## Students

### GET /api/students
Returns `{ users: [...] }` — flat student objects, NOT paginated.
```
keys: _id, companyName, rollNumber, image, name, father_name, mobile_number, phone_number, present_address, city, email, date_of_birth, education_qualification, student_status, dropOutStudent, select_course, courseName, course_fees, discount, netCourseFees, remainingCourseFees, totalPaid, down_payment, date_of_joining, no_of_installments, no_of_installments_amount, createdAt, updatedAt
```
- `companyName` = company ObjectId (string)
- `courseName` = course ObjectId (string)
- `select_course` = course name (string)
- `name` = full name (single field, NOT firstName+lastName)
- `student_status` = "active" | "dropout"
- `dropOutStudent` = boolean

### GET /api/students/company/:companyId/course/:courseId
Returns `{ success: true, data: [...students...] }` — same flat student objects filtered by company+course.

### GET /api/students/:email
Returns single student by email (for logged-in user profile). Returns null for non-student roles.

### GET /api/complete/course/students
Returns `[]` (completed course students)

## Courses

### GET /api/courses
Returns plain array of 38 courses with **populated** references.
```
keys: _id, courseName, courseFees, courseType, numberOfYears, category, user, createdBy, createdAt, updatedAt, __v
```
- `courseType` = populated object: `{ _id, courseType: "Semester", user, createdBy, createdAt, updatedAt, __v }`
- `numberOfYears` = populated object: `{ _id, numberOfYears: 3, user, createdBy, createdAt, updatedAt, __v }`
- `category` = populated object: `{ _id, category: "Graphic Designing", user, createdBy, createdAt, updatedAt, __v }`
- `user` = populated user object (includes password hash! should be stripped in new API)
- `_id` = prod ObjectId (e.g. `689c39d40cf03d7418bfde07`)

### GET /api/courses/categories
Plain array of category objects.
```json
[{ "_id": "...", "category": "Web Designing", "user": "...", "createdBy": "...", "createdAt": "...", "__v": 0 }]
```

### GET /api/courses/courseType
Plain array.
```json
[{ "_id": "...", "courseType": "Annual", "user": "...", "createdBy": "...", "createdAt": "...", "__v": 0 }]
```

### GET /api/courses/numberOfYears
Plain array.
```json
[{ "_id": "...", "numberOfYears": 1, "user": "...", "createdBy": "...", "createdAt": "...", "__v": 0 }]
```

## Fees

### GET /api/courseFees/allCourseFess
Array of 384 fee payment records with **populated** studentInfo.
```
keys: _id, studentInfo, companyName, courseName, netCourseFees, remainingFees, amountPaid, amountDate, no_of_installments, no_of_installments_amount, reciptNumber, paymentOption, lateFees, createdAt, updatedAt, __v, gst_percentage
```
- `studentInfo` = populated student object (full student with name, mobile, etc.)

## Company

### GET /api/company
Plain array of company objects.
```
keys: _id, logo, companyName, email, companyPhone, companyWebsite, companyAddress, reciptNumber, gst, isGstBased, createdAt, updatedAt, __v
```

### GET /api/company/:id
Single company object (same keys).

## RBAC

### GET /api/user-role
```json
{ "success": true, "roleAccessData": [{ "_id": "...", "role": "SuperAdmin", "companyPermissions": { "Visual Media Academy": true }, "studentControlAccess": { "Add Student": true }, "studentFeesAccess": { "Add Student Fees": true } }] }
```

## Daybook

### GET /api/dayBook
Array of 70 daybook account objects.
```
keys: _id, accountName, accountType, companyId, createdAt, updatedAt, __v
```

### GET /api/dayBook/data
Array of 1089 daybook entry objects.
```
keys: _id, studentLateFees, dayBookDatadate, accountName, naretion, debit, credit, dayBookAccountId, balance, companyId, createdAt, updatedAt, __v
```

## Forms & Custom Fields

### GET /api/add-form
Array of form definitions.
```
keys: _id, formName, companyName, fields, createdAt, updatedAt, __v
```

### GET /api/custom-field
Array of 22 custom field definitions.
```
keys: _id, type, name, value, mandatory, quickCreate, headerView, keyField, options, formId, createdAt, updatedAt, __v
```

### GET /api/select-field
```json
{ "success": true, "defaultSelects": [...] }
```
keys: _id, selectName, options, mandatory, type

### GET /api/submit-form
```json
{ "success": true, "formFieldValues": [{ "_id", "formId", "companyId", "formFiledValue": [...] }] }
```

### GET /api/columns
```json
{ "success": true, "columnData": [] }
```

### GET /api/rows
```json
{ "success": true, "rowData": [] }
```

## Attendance / Trainers / Timings

### GET /api/add-trainer
```json
{ "trainers": [{ "trainerRole": "Trainer", "_id", "trainerImage", "trainerName", "trainerDesignation", "trainerEmail", "companyId", "createdAt", "updatedAt", "__v" }] }
```

### GET /api/add-timing
Array of timing objects.
```
keys: _id, startTime, endTime, companyId, createdAt, updatedAt, __v
```

### GET /api/add-lab
`[]` (empty)

## Email / Notifications

### GET /api/emailRemainder
Array of 1 email remainder template.
```
keys: _id, firstRemainder, thirdRemainder, createdAt, updatedAt, __v
```

### GET /api/emailRemainder/status
```json
{ "emailSuggestions": [{ "_id", "emailSuggestionStatus": false }] }
```

### GET /api/emailRemainder/welcome/status
```json
{ "emailSuggestions": [{ "_id", "welcomeemailsuggestion": true }] }
```

### GET /api/emailRemainder/late-fees/status
```json
{ "lateFeesSuggestion": [{ "_id", "lateFees": true }] }
```

### GET /api/emailRemainder/remainder-dates
```json
[{ "_id", "firstDueDay": 9, "secondDueDay": 15, "thirdDueDay": 20, "__v": 0 }]
```

### GET /api/email/allTemplates
Array of 1 email template.
```
keys: _id, customTemplate, cancellationTemplate, dynamicTemplate, courseSubjectTemplate, courseChangeTemplate, createdAt, updatedAt, __v
```

### GET /api/whatsAppMessageSuggestion/status
```json
[{ "_id", "whatsappSuggestionStatus": false }]
```

### GET /api/student-gst-suggestions
```json
[{ "_id", "gst_percentage": 18 }]
```

## Student Issues / Notes / Alerts

### GET /api/student-issues
Array of 28 issue objects.
```
keys: _id, date, particulars, addedBy, studentId, showOnDashboard, createdAt, updatedAt, __v
```

### GET /api/student-issues/showStudentDashboard
Array of 34 dashboard visibility flags.
```
keys: _id, studentId, showStudent, studentName, __v
```

### GET /api/student-notes
```json
{ "success": true, "allStudentNotes": [{ "_id", "date", "particulars", "startTime", "addedBy", "userId", "companyId" }] }
```

### GET /api/students/createAlertStudentPendingFees/get
Array of alert objects.
```
keys: _id, studentId, Date, RemainderDateAndTime, Status, particulars, isEmailSent, __v
```

### GET /api/students/getStudentAlertStudentPendingFees
Same as above.

## Subjects

### GET /api/subjects
Array of 126 subject objects with **populated** course reference.
```
keys: _id, subjectName, subjectCode, fullMarks, passMarks, course, courseType, semYear, addedBy, createdAt, updatedAt, __v
```
- `course` = populated course object

## Payments

### GET /api/paymentOptions
Array of 10 payment option objects.
```
keys: _id, name, date, createdBy, createdAt, updatedAt, __v
```

## Users

### GET /api/users
Returns `{ data: [...users...], payload: {...} }` — user list for admin panel.
```
user keys: id, fName, lName, email, role, phone
```

## Fee Installments & Not-Paid

### GET /api/courseFees/paymentInstallmentFees/:companyId
Array of 160 installment records with **populated** studentInfo.
```
keys: _id, studentInfo, companyName, courseName, expiration_date, installment_number, installment_amount, dropOutStudent, createdAt, updatedAt, __v
```
- `studentInfo` = populated flat student object (same keys as /api/students)

### POST /api/courseFees/get-not-paid-students
Request body: `{ toDate, fromDate, companyId }`
Response: `{ notPaidStudents: [...students...] }`
- Students with extra fields: `missingMonths`, `message`, `updatedBy`

## Commissions

### GET /api/students/commissionList
Returns `[]` (plain array of commission records)

## Approvals

### GET /api/receipt-approval
```json
{ "success": true, "approvalData": [{ "_id", "status", "reciept", "companyId", "studentId", "check", "__v" }] }
```
