#!/bin/bash
set +e

BASE="https://ims-fullstack.onrender.com"
T="e2e_test"
PASS=0
FAIL=0
ERRORS=""

ok() { echo "  ✓ $1"; PASS=$((PASS+1)); }
fail() { echo "  ✗ $1: $2"; FAIL=$((FAIL+1)); ERRORS="$ERRORS\n  ✗ $1: $2"; }
check() {
  local name="$1" json="$2"
  local val=$(echo "$json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success',False))" 2>/dev/null)
  if [ "$val" = "True" ]; then ok "$name"; else fail "$name" "$(echo "$json" | head -c 200)"; fi
}
extract() { echo "$1" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null; }

# Login
RESP=$(curl -s -X POST "$BASE/api/v1/auth/login" -H "Content-Type: application/json" -H "X-Tenant-Id: $T" -d '{"email":"admin@e2etest.in","password":"TestPass@123"}')
TOKEN=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['tokens']['accessToken'])" 2>/dev/null)
if [ -z "$TOKEN" ]; then echo "LOGIN FAILED: $RESP"; exit 1; fi
echo "LOGIN: OK"

H1="Authorization: Bearer $TOKEN"
H2="Content-Type: application/json"
H3="X-Tenant-Id: $T"
post() { curl -s -X POST "$BASE$1" -H "$H1" -H "$H2" -H "$H3" -d "$2"; }
get() { curl -s "$BASE$1" -H "$H1" -H "$H3"; }
put() { curl -s -X PUT "$BASE$1" -H "$H1" -H "$H2" -H "$H3" -d "$2"; }

# ===== 1. BATCHES =====
echo -e "\n===== 1. BATCHES ====="
R=$(post "/api/v1/batches" '{"name":"E2E-Batch-1","startDate":"2026-01-01"}')
check "Create" "$R"
BID=$(extract "$R")
check "List" "$(get "/api/v1/batches")"
check "Get" "$(get "/api/v1/batches/$BID")"
check "Update" "$(put "/api/v1/batches/$BID" '{"name":"E2E-Batch-Updated"}')"

# ===== 2. RBAC =====
echo -e "\n===== 2. RBAC ====="
R=$(post "/api/v1/rbac" '{"role":"Admin","permissions":{"viewStudents":true,"editFees":true}}')
check "Create" "$R"
RBID=$(extract "$R")
check "List" "$(get "/api/v1/rbac")"
check "Get by role" "$(get "/api/v1/rbac/by-role/Admin")"
check "Update" "$(put "/api/v1/rbac/$RBID" '{"permissions":{"viewStudents":true,"editFees":true,"viewDashboard":true}}')"

# ===== 3. MARKS =====
echo -e "\n===== 3. MARKS ====="
R=$(post "/api/v1/marks" '{"studentId":"stu001","courseId":"crs001","subjects":[{"subjectName":"Math","subjectCode":"M101","theory":85,"practical":90}]}')
check "Create" "$R"
MID=$(extract "$R")
check "List" "$(get "/api/v1/marks")"
check "Get" "$(get "/api/v1/marks/$MID")"
check "Update" "$(put "/api/v1/marks/$MID" '{"resultStatus":"Completed"}')"

# ===== 4. COMPLETIONS =====
echo -e "\n===== 4. COMPLETIONS ====="
R=$(post "/api/v1/completions" '{"studentId":"stu001","courseId":"crs001","completionDate":"2026-03-01","status":"completed","certificateNumber":"CERT-001"}')
check "Create" "$R"
CID=$(extract "$R")
check "List" "$(get "/api/v1/completions")"
check "Get" "$(get "/api/v1/completions/$CID")"
check "Update" "$(put "/api/v1/completions/$CID" '{"status":"withdrawn"}')"

# ===== 5. INSTALLMENTS =====
echo -e "\n===== 5. INSTALLMENTS ====="
R=$(post "/api/v1/installments" '{"studentId":"stu001","courseId":"crs001","installmentNumber":1,"installmentAmount":25000,"dueDate":"2026-04-01"}')
check "Create" "$R"
IID=$(extract "$R")
check "List" "$(get "/api/v1/installments")"
check "Get" "$(get "/api/v1/installments/$IID")"
check "Mark paid" "$(put "/api/v1/installments/$IID/pay" '{"paidDate":"2026-04-01"}')"

# ===== 6. RECEIPTS =====
echo -e "\n===== 6. RECEIPTS ====="
check "Get counter" "$(get "/api/v1/receipts")"
check "Get next" "$(get "/api/v1/receipts/next")"
check "Update config" "$(put "/api/v1/receipts" '{"prefix":"RCP"}')"

# ===== 7. DAYBOOK =====
echo -e "\n===== 7. DAYBOOK ====="
R=$(post "/api/v1/daybook/accounts" '{"accountName":"Cash Account","accountType":"cash"}')
check "Create account" "$R"
DAID=$(extract "$R")
RE=$(post "/api/v1/daybook/entries" "{\"accountId\":\"$DAID\",\"narration\":\"Fee received\",\"credit\":5000,\"date\":\"2026-03-01\"}")
check "Create entry" "$RE"
check "List accounts" "$(get "/api/v1/daybook/accounts")"
check "List entries" "$(get "/api/v1/daybook/entries")"

# ===== 8. NOTES =====
echo -e "\n===== 8. NOTES ====="
R=$(post "/api/v1/notes" '{"studentId":"stu001","particulars":"Follow up on fees","addedBy":"admin"}')
check "Create" "$R"
NID=$(extract "$R")
check "List" "$(get "/api/v1/notes")"
check "Get" "$(get "/api/v1/notes/$NID")"
check "Update" "$(put "/api/v1/notes/$NID" '{"particulars":"Follow up - Updated"}')"

# ===== 9. ISSUES =====
echo -e "\n===== 9. ISSUES ====="
R=$(post "/api/v1/issues" '{"studentId":"stu001","particulars":"Fee dispute - late fee charge","addedBy":"admin"}')
check "Create" "$R"
ISID=$(extract "$R")
check "List" "$(get "/api/v1/issues")"
check "Get" "$(get "/api/v1/issues/$ISID")"
check "Update status" "$(put "/api/v1/issues/$ISID" '{"status":"inProgress"}')"

# ===== 10. APPROVALS =====
echo -e "\n===== 10. APPROVALS ====="
R=$(post "/api/v1/approvals" '{"receiptId":"rec001","studentId":"stu001","remarks":"Waive late fee"}')
check "Create" "$R"
APID=$(extract "$R")
check "List" "$(get "/api/v1/approvals")"
check "Get" "$(get "/api/v1/approvals/$APID")"
check "Review" "$(put "/api/v1/approvals/$APID/review" '{"status":"approved","reviewedBy":"admin001","remarks":"Approved"}')"

# ===== 11. PAYMENT OPTIONS =====
echo -e "\n===== 11. PAYMENT OPTIONS ====="
R=$(post "/api/v1/payment-options" '{"name":"UPI","createdBy":"admin"}')
check "Create" "$R"
POID=$(extract "$R")
check "List" "$(get "/api/v1/payment-options")"
check "Update" "$(put "/api/v1/payment-options/$POID" '{"name":"UPI Payment"}')"

# ===== 12. CUSTOM FORMS =====
echo -e "\n===== 12. CUSTOM FORMS ====="
R=$(post "/api/v1/custom-forms/forms" '{"formName":"Feedback Form","fields":[{"name":"rating","type":"number","mandatory":true},{"name":"comments","type":"text"}]}')
check "Create form" "$R"
CFID=$(extract "$R")
check "List forms" "$(get "/api/v1/custom-forms/forms")"
check "Get form" "$(get "/api/v1/custom-forms/forms/$CFID")"
RS=$(post "/api/v1/custom-forms/forms/$CFID/submissions" '{"values":[{"fieldName":"rating","fieldType":"number","value":5},{"fieldName":"comments","fieldType":"text","value":"Great"}]}')
check "Submit form" "$RS"
check "List submissions" "$(get "/api/v1/custom-forms/forms/$CFID/submissions")"

# ===== 13. EMAIL TEMPLATES =====
echo -e "\n===== 13. EMAIL TEMPLATES ====="
R=$(post "/api/v1/email-templates" '{"templateName":"e2e_welcome","subject":"Welcome!","body":"<h1>Hello {{name}}</h1>"}')
check "Create" "$R"
ETID=$(extract "$R")
check "List" "$(get "/api/v1/email-templates")"
check "Get" "$(get "/api/v1/email-templates/$ETID")"
check "Update" "$(put "/api/v1/email-templates/$ETID" '{"subject":"Welcome Updated!"}')"

# ===== 14. LABS =====
echo -e "\n===== 14. LABS ====="
R=$(post "/api/v1/labs" '{"labName":"Computer Lab"}')
check "Create" "$R"
LID=$(extract "$R")
check "List" "$(get "/api/v1/labs")"
check "Update" "$(put "/api/v1/labs/$LID" '{"labName":"Computer Lab - Updated"}')"

# ===== 15. TIMINGS =====
echo -e "\n===== 15. TIMINGS ====="
R=$(post "/api/v1/timings" '{"startTime":"09:00","endTime":"12:00"}')
check "Create" "$R"
TID=$(extract "$R")
check "List" "$(get "/api/v1/timings")"
check "Update" "$(put "/api/v1/timings/$TID" '{"endTime":"13:00"}')"

# ===== 16. PROFILE =====
echo -e "\n===== 16. PROFILE ====="
check "Update" "$(put "/api/v1/profile" '{"firstName":"E2E","lastName":"Admin","contactPhone":"9876543210"}')"
check "Get" "$(get "/api/v1/profile")"

# ===== 17. COMMISSIONS =====
echo -e "\n===== 17. COMMISSIONS ====="
R=$(post "/api/v1/commissions" '{"studentName":"Test Student","commissionPersonName":"Referrer","commissionAmount":5000,"commissionPaid":0,"commissionDate":"2026-03-01"}')
check "Create" "$R"
CMID=$(extract "$R")
check "List" "$(get "/api/v1/commissions")"
check "Get" "$(get "/api/v1/commissions/$CMID")"
check "Update" "$(put "/api/v1/commissions/$CMID" '{"commissionPaid":2000}')"

# ===== 18. ROLL NUMBERS =====
echo -e "\n===== 18. ROLL NUMBERS ====="
check "Get counter" "$(get "/api/v1/roll-numbers")"
check "Get next" "$(get "/api/v1/roll-numbers/next")"
check "Update config" "$(put "/api/v1/roll-numbers" '{"prefix":"RN"}')"

# ===== 19. SETTINGS =====
echo -e "\n===== 19. SETTINGS ====="
check "Get" "$(get "/api/v1/settings")"
check "Update" "$(put "/api/v1/settings" '{"notifications":{"whatsappEnabled":true},"fees":{"gstPercentage":18}}')"

echo -e "\n==========================================="
echo "RESULTS: $PASS passed, $FAIL failed out of $((PASS+FAIL)) tests"
echo "==========================================="
if [ $FAIL -gt 0 ]; then
  echo -e "\nFAILURES:$ERRORS"
fi
