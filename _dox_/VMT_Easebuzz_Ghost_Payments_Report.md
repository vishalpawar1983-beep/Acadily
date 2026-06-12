# EASEBUZZ GHOST PAYMENTS — FORENSIC REPORT

**Visual Media Technology (VMT) — Easebuzz Payment Gateway Misuse Analysis**

---

| | |
|---|---|
| **Entity** | Visual Media Academy, SCO 114-115, 4th Floor, Sector 34-A, Chandigarh 160022 |
| **Investigation Period** | January 1, 2026 — March 23, 2026 |
| **Gateway** | Easebuzz EduPay — MID-5965, SubMID-3625 |
| **Settlement Bank** | Indian Bank, A/C 7808540007, IFSC IDIB000C073 |
| **Report Date** | March 23, 2026 |
| **Commissioned By** | Vishal Anu (50% Owner) |
| **Classification** | CONFIDENTIAL — For Settlement & Legal Purposes |
| **Related Reports** | VMT Settlement Report, VMT Forensic Audit Report, VMT Ownership Audit Report |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Methodology](#2-methodology)
3. [All 8 Easebuzz Transactions — Jan to Mar 2026](#3-all-8-easebuzz-transactions)
4. [MongoDB Cross-Check — Zero Matches](#4-mongodb-cross-check)
5. [Vishal Pawar CC Swipe Pattern](#5-vishal-pawar-cc-swipe-pattern)
6. [Unidentified Ghost Payers](#6-unidentified-ghost-payers)
7. [Historical Precedent — Dec 2024](#7-historical-precedent)
8. [Email Evidence Trail](#8-email-evidence-trail)
9. [Conclusions & Recommendations](#9-conclusions--recommendations)

---

## 1. EXECUTIVE SUMMARY

Between January 1 and March 9, 2026, **8 credit card transactions totaling ₹1,30,000** were processed through the Easebuzz "Visual Media Academy Fees Collection" student registration form. All 8 transactions were settled to Indian Bank A/C 7808540007.

**None of these 8 payers exist as students in the fee management system.** No fee receipts were issued. No daybook entries were created. No form submissions were recorded. The money entered the bank account with zero trail in the business system.

Of the ₹1,30,000:
- **₹68,500** (53%) was swiped by **Vishal Pawar** (former partner) using his own credit cards with fake/disposable email addresses
- **₹61,500** (47%) was swiped under 5 other names with no verifiable identity in the system

A December 2024 daybook entry explicitly referencing an "HDFC CC swipe (50K) in Canara VMT via easebuzz" confirms this was an established practice predating the settlement period.

---

## 2. METHODOLOGY

### Data Sources

| Source | Method | Records Examined |
|---|---|---|
| Gmail (visualmediatechnology@gmail.com) | IMAP access, all Easebuzz emails Jan–Mar 2026 | 46 Easebuzz emails |
| Easebuzz Settlement CSVs | Extracted from email attachments | 8 settlement CSV files |
| MongoDB (flex_academy_dev) | Direct query across all 41 collections | 540 students, 879 fee payments, 211 installments, 1,089 daybook entries |
| Fee Register (VM-2712 to VM-2773) | Cross-referenced against Easebuzz payer names | 61 receipts |

### Verification Process

For each Easebuzz transaction, the following checks were performed:
1. **Student name search** — case-insensitive regex across `students`, `studentissues`, `studentalerts`, `studentmarks`, `studentnotes` collections
2. **Phone number search** — across all collections with phone/mobile fields
3. **Email search** — across all collections with email fields
4. **Fee payment match** — amount + name search in `feepayments` and `feeinstallments`
5. **Daybook match** — narration search in `daybookentries`
6. **Form submission match** — search in `formsubmissions` and `admissionforms`
7. **Fee register match** — cross-reference against VM-2712 to VM-2773 receipt register

---

## 3. ALL 8 EASEBUZZ TRANSACTIONS — Jan to Mar 2026

### Complete Transaction Register

| # | Txn Date | Customer Name | Amount | Card | Easebuzz Txn ID | Merchant Txn ID | Payout Date | Payout ID | NEFT Ref |
|---:|---|---|---:|---|---|---|---|---|---|
| 1 | Jan 1 | Vishal Pawar | ₹5,500 | VISA | E2601010RJFXUK | ERgAfkTrBZ | Jan 2 | PSMEMVZGNU | YESF260025137647 |
| 2 | Jan 15 | Vipin Kumar | ₹30,000 | MC | E2601150S9IBLK | ERvR0AWOc9 | Jan 16 | PSMV0ZDRQE | YESF260164870816 |
| 3 | Jan 23 | Vishal Pawar | ₹50,000 | VISA | E2601230SMQX45 | EREpaq3v98 | Jan 27 | PSUS7XDRIW | YESF260275133783 |
| 4 | Jan 28 | Deepak Arora | ₹12,000 | VISA | E2601280SX53ES | ERyvRSWAZE | Jan 29 | PSXAMIKTLY | YESF260295062437 |
| 5 | Feb 24 | Binoj Kumar | ₹3,000 | RUPAY | E2602240UC43JV | ERJoBwgjlh | Feb 25 | PSBY4RG0LR | YESF260565078360 |
| 6 | Feb 25 | Vishal Pawar | ₹13,000 | VISA | E2602250UEKLWA | ERzV2qGBLT | Feb 26 | PSQCU8CAJG | YESF260575774893 |
| 7 | Mar 2 | Vipin Singh | ₹7,500 | VISA | E2603020UOUR7B | ERZP3IorM1 | Mar 4 | PSCOPWFKBY | YESF260634857432 |
| 8 | Mar 9 | Dalip Chand | ₹9,000 | MC | E2603090V3M3FK | ERoLY1Ni1B | Mar 10 | PSSNJXPSCG | YESF260695406572 |
| | | **TOTAL** | **₹1,30,000** | | | | | | |

### Customer Details from Easebuzz CSVs

| # | Customer Name | Email | Phone | Product Info |
|---:|---|---|---|---|
| 1 | Vishal Pawar | vishalpawar198@gmail.com | 9357233337 | Student Registration |
| 2 | Vipin Kumar | vipin.kishore@gmail.com | 8950807600 | Student Registration |
| 3 | Vishal Pawar | jacob@gmail.com | 9478809930 | Student Registration |
| 4 | Deepak Arora | deep@gmail.com | 7696300600 | Student Registration |
| 5 | Binoj Kumar | jaishalgujjar2@gmail.com | 6397663312 | Student Registration |
| 6 | Vishal Pawar | vm234@gmail.com | 9478809930 | Student Registration |
| 7 | Vipin Singh | vipinsing@gmail.com | 7888827385 | Student Registration |
| 8 | Dalip Chand | dalipchand21@gmail.com | 8427880080 | Student Registration |

### Service Charges & Net Settlement

| # | Gross (Debited) | TDR (1.5%) | GST | Net Settled |
|---:|---:|---:|---:|---:|
| 1 | ₹5,599.10 | ₹83.99 | ₹15.12 | ₹5,500.00 |
| 2 | ₹30,540.57 | ₹458.11 | ₹82.46 | ₹30,000.00 |
| 3 | ₹50,900.95 | ₹763.51 | ₹137.43 | ₹50,000.00 |
| 4 | ₹12,216.23 | ₹183.24 | ₹32.98 | ₹12,000.00 |
| 5 | ₹3,054.06 | ₹45.81 | ₹8.25 | ₹3,000.00 |
| 6 | ₹13,234.25 | ₹198.51 | ₹35.73 | ₹13,000.00 |
| 7 | ₹7,635.14 | ₹114.53 | ₹20.61 | ₹7,500.00 |
| 8 | ₹9,162.17 | ₹137.43 | ₹24.74 | ₹9,000.00 |
| **Total** | **₹1,32,342.47** | **₹1,985.13** | **₹357.32** | **₹1,30,000.00** |

> The card holders collectively paid ₹2,342.47 in gateway fees (TDR + GST) on top of the ₹1,30,000 net amount.

---

## 4. MONGODB CROSS-CHECK — ZERO MATCHES

Every payer name, email, and phone number was searched across all 41 collections in the flex_academy_dev database (540 students, 879 fee payments, 211 installments, 1,089 daybook entries, 607 email logs, 1 form submission, 0 admission forms).

| Payer | students | feepayments | feeinstallments | daybook | emaillogs | formsubmissions | Fee Register (VM-xxxx) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Vishal Pawar | 0 | 0 | 0 | 63* | 0 | 0 | 0 |
| Vipin Kumar | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Deepak Arora | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Binoj Kumar | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Vipin Singh | 0 | 0 | 0 | 1** | 0 | 0 | 0 |
| Dalip Chand | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

\* *Vishal Pawar's 63 daybook mentions are all personal/partner expenses (gym fees, dad's birthday, rent, loan interest to Umesh, etc.) — none are student fee entries.*

\** *Vipin Singh's single daybook entry is "Vipin Singh M4S Rent Share Transfer" (₹2,500 debit, Jun 2025) — a rent transfer, not a student payment.*

### Phone Number Cross-Check

| Phone | Used By | Found in users? | Found in students? | Found in teachers? | Found in trainers? |
|---|---|:---:|:---:|:---:|:---:|
| 9357233337 | Vishal Pawar (Txn 1) | NO | NO | NO | NO |
| 8950807600 | Vipin Kumar (Txn 2) | NO | NO | NO | NO |
| 9478809930 | Vishal Pawar (Txn 3, 6) | NO | NO | NO | NO |
| 7696300600 | Deepak Arora (Txn 4) | NO | NO | NO | NO |
| 6397663312 | Binoj Kumar (Txn 5) | NO | NO | NO | NO |
| 7888827385 | Vipin Singh (Txn 7) | NO | NO | NO | NO |
| 8427880080 | Dalip Chand (Txn 8) | NO | NO | NO | NO |

**Not a single phone number from any Easebuzz transaction exists anywhere in the system.**

---

## 5. VISHAL PAWAR CC SWIPE PATTERN

Vishal Pawar (former 50% partner, equity transferred March 6, 2026) used the Easebuzz student registration gateway 3 times in the settlement period:

| # | Date | Amount | Email Used | Phone | Card |
|---:|---|---:|---|---|---|
| 1 | Jan 1 | ₹5,500 | vishalpawar198@gmail.com | 9357233337 | VISA |
| 3 | Jan 23 | ₹50,000 | jacob@gmail.com | 9478809930 | VISA |
| 6 | Feb 25 | ₹13,000 | vm234@gmail.com | 9478809930 | VISA |
| | **Total** | **₹68,500** | | | |

### Red Flags

1. **Fake/disposable emails**: "jacob@gmail.com" and "vm234@gmail.com" are clearly not real student emails
2. **Different phones**: Uses 9357233337 on first transaction, then switches to 9478809930 for the next two
3. **"Student Registration" product**: All transactions labeled as student fee payments, but he is a partner, not a student
4. **No corresponding records**: No fee receipt, no daybook entry, no student enrollment for any of these amounts
5. **Pattern matches historical behavior**: Daybook shows extensive personal use of company funds (see Section 7)

### Daybook Evidence of Personal Expense Pattern

The daybook contains 63 entries mentioning "Vishal" — a sample of personal expenses run through the business:

| Date | Narration | Debit |
|---|---|---:|
| Jan 27, 2025 | Vishal gym fees bia anu yes cc | ₹5,000 |
| Jan 27, 2025 | Vishal gym fees bia Vishal hpay | ₹1,500 |
| Jan 16, 2025 | Dad Birthday gift via Vishal Gpay | ₹1,800 |
| Jan 16, 2025 | Dad Bday Cake via Vishal RBL CC | ₹800 |
| Jan 16, 2025 | VIshal Lunch via Vishal Gpay | ₹100 |
| Jan 16, 2025 | Electric Car Recharge via Vishal Gpay | ₹200 |
| Jun 4, 2025 | Vishal personal expense | ₹400 |

Additionally, numerous interest payments to "Umesh" via "Vishal Gpay" (ranging ₹5,000–₹12,500 each, 15+ entries in Apr 2025 alone) suggest personal loan servicing through the business daybook.

---

## 6. UNIDENTIFIED GHOST PAYERS

Five transactions were made under names that have zero trace anywhere in the system:

| # | Name | Amount | Email | Phone | Assessment |
|---:|---|---:|---|---|---|
| 2 | Vipin Kumar | ₹30,000 | vipin.kishore@gmail.com | 8950807600 | Unknown identity. Different person from "Vipin Singh" (Txn 7 — different email, different phone). Largest non-Pawar ghost payment. |
| 4 | Deepak Arora | ₹12,000 | deep@gmail.com | 7696300600 | Unknown. Generic email "deep@gmail.com" suggests fake. |
| 5 | Binoj Kumar | ₹3,000 | jaishalgujjar2@gmail.com | 6397663312 | Unknown. Email name "jaishal gujjar" doesn't match payer name "Binoj Kumar" — likely someone else's card or fake identity. |
| 7 | Vipin Singh | ₹7,500 | vipinsing@gmail.com | 7888827385 | Only daybook trace is a Jun 2025 rent transfer. Not a student. |
| 8 | Dalip Chand | ₹9,000 | dalipchand21@gmail.com | 8427880080 | Absolute zero — no trace in any collection, any field, anywhere. |

**Total unidentified: ₹61,500**

The mismatch between payer names and email addresses (e.g., "Binoj Kumar" using "jaishalgujjar2@gmail.com") suggests either identity masking or use of third-party cards.

---

## 7. HISTORICAL PRECEDENT — Dec 2024

A daybook entry from December 21, 2024 explicitly describes an Easebuzz CC swipe:

| Field | Value |
|---|---|
| **Narration** | "From HDFC CC swipe (50K) in Canara VMT via easebuzz" |
| **Amount** | ₹50,000 (credit) |
| **Account** | Shubham Pawar |
| **Date** | December 16, 2024 |
| **Created** | December 21, 2024 |

This entry confirms:
1. The practice of using Easebuzz as a CC swipe terminal was established **before** the settlement period
2. The ₹50,000 amount matches the Jan 23, 2026 swipe (also ₹50,000)
3. The narration explicitly uses the term "CC swipe" — not student payment
4. It was booked under "Shubham Pawar" account in the daybook (unlike the 2026 transactions, which have no daybook entry at all)

---

## 8. EMAIL EVIDENCE TRAIL

### Easebuzz Email Sequence Per Transaction

Each Easebuzz transaction generates a 3-email sequence:

| Step | Email Subject | Purpose |
|---:|---|---|
| 1 | "EduEasebuzz: Visual Media Academy Fees Collection New Registration" | Form submission notification |
| 2 | "EduEasebuzz: Successful Registration Payment" | Payment confirmation with amount, name, txn ID |
| 3 | "Settlement Report for [date] - MID-5965 - SubMID-3625" | Settlement CSV with full transaction details |

All 8 transactions have complete email trails with attached CSV files containing:
- Easebuzz Transaction ID
- Card type (VISA/MC/RUPAY)
- Customer name, email, phone
- NEFT reference number for bank settlement
- Exact amounts (gross, TDR, GST, net)

### What's Missing from Email

- No welcome emails sent to ghost payers (Kiranjot and Yash Ratta received welcome emails; none of the 8 Easebuzz payers did)
- No fee confirmation emails sent to ghost payers
- No payment reminder emails sent to ghost payers
- No OTP login emails associated with ghost payer email addresses

---

## 9. CONCLUSIONS & RECOMMENDATIONS

### Findings

1. **₹1,30,000 in ghost payments** processed through the student fee gateway with zero system records
2. **Vishal Pawar personally swiped ₹68,500** using the student registration form with fake emails
3. **5 unidentified persons swiped ₹61,500** — identities unverifiable, possible proxies or fake names
4. **All funds settled to Indian Bank A/C 7808540007** — account ownership verification needed
5. **Established pattern** — Dec 2024 daybook entry proves this practice predates the settlement period
6. **Total gateway fees absorbed: ₹2,342.47** — someone paid 1.8% TDR+GST on these swipes, suggesting the card holders willingly paid the surcharge to convert credit to cash

### Recommended Actions

1. **Obtain Indian Bank A/C 7808540007 statement** (Jan–Mar 2026) to verify all 8 NEFT settlements were received
2. **Request Easebuzz merchant dashboard access** to check for any pre-2026 transactions not captured by email
3. **Identify the 5 ghost payers** — cross-reference phone numbers with known associates, staff, or sub-tenants
4. **Include ₹1,30,000 in settlement calculation** — these funds entered the business bank account during the settlement period and must be accounted for in the 50/50 split
5. **Review Easebuzz KYC** — determine who controls the merchant account (MID-5965) and who can initiate transactions
6. **Preserve all Easebuzz CSVs** as evidence — settlement files with NEFT references are independently verifiable through the bank

### Settlement Impact

| Item | Amount |
|---|---:|
| Previously reported fee collections (Jan–Mar) | ₹4,37,075 |
| Easebuzz ghost payments (this report) | ₹1,30,000 |
| **Revised total inflow to bank** | **₹5,67,075** |
| 50% share (each partner) | ₹2,83,538 |

> The ₹1,30,000 in undisclosed Easebuzz receipts increases the settlement-eligible revenue by 29.7%.

---

*Report generated from primary source data: Easebuzz settlement CSV attachments, Gmail IMAP records, and MongoDB flex_academy_dev database queries. All transaction IDs, NEFT references, and bank details are independently verifiable.*
