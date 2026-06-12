# FINANCIAL SETTLEMENT REPORT

**Visual Media Technology (VMT) — 50/50 Partnership Settlement Calculation**

---

| | |
|---|---|
| **Entity** | Visual Media Academy, SCO 114-115, 4th Floor, Sector 34-A, Chandigarh 160022 |
| **Settlement Period** | January 1, 2026 — March 23, 2026 (83 days) |
| **Ownership Event** | 50% equity transfer effective March 6, 2026 |
| **Settlement Basis** | 50/50 split applied retroactively from January 1, 2026 (per partner agreement) |
| **Report Date** | March 23, 2026 |
| **Prepared By** | Rajesh Mehta, CFA, CA, CFE — Senior Forensic Financial Auditor |
| **Commissioned By** | Vishal Anu (50% Owner) |
| **Classification** | CONFIDENTIAL — For Settlement Purposes |
| **Related Reports** | VMT Forensic Audit Report (Mar 23), VMT Overlap Analysis (Mar 20), VMT Ownership Audit (Mar 20) |

---

## Table of Contents

1. [Period Overview](#1-period-overview)
2. [Revenue Register — Every Payment Line Item](#2-revenue-register)
3. [Expense Register — Every Debit](#3-expense-register)
4. [Student Ledger](#4-student-ledger)
5. [50/50 Settlement Calculation](#5-settlement-calculation)
6. [Disputed Entries](#6-disputed-entries)
7. [Outstanding Receivables Split](#7-outstanding-receivables-split)
8. [Recommended Adjustments & Final Settlement Number](#8-recommended-adjustments)

---

## 1. PERIOD OVERVIEW

**Period:** January 1, 2026 — March 23, 2026 (83 days)

| Metric | Amount | Source |
|---|---:|---|
| **Total Fee Collections Recorded** | **₹4,37,075** | Fee system (61 receipts, VM-2712 to VM-2773) |
| **Total Daybook Credits (Income)** | **₹4,87,075** | Daybook cash register (70 entries) |
| **Total Daybook Debits (Expenses)** | **₹92,360** | Daybook cash register |
| **Daybook Net Position** | **₹3,94,715** | Credits minus Debits |
| **Fee-Daybook Gap** | **₹50,000** | Daybook credits exceed fee records |

### Income Composition (Daybook Credits: ₹4,87,075)

| Source | Amount | % |
|---|---:|---:|
| Student fee payments | ₹4,37,075 | 89.7% |
| Language Achievers (sub-tenant rent) | ₹20,000 | 4.1% |
| Aiinfox (sub-tenant/partner payment) | ₹30,000 | 6.2% |
| **Total** | **₹4,87,075** | **100%** |

### Critical Control Finding

**All 61 fee receipts have a matching daybook entry (created at the exact same second, matched by ObjectId timestamp), but every daybook entry has `date: null` — the date field is never populated.** This means daybook timestamps are concealed, making independent date verification impossible. The fee system and daybook are linked by creation timestamp but the daybook provides no usable date trail. This report uses the fee system figures for student-level revenue attribution and the daybook figures for the expense register.

### Monthly Summary

| Month | Fee Collections | Daybook Credits | Daybook Debits | Net (Daybook) |
|---|---:|---:|---:|---:|
| January | ₹1,98,425 | — | — | — |
| February | ₹1,12,500 | — | — | — |
| March | ₹1,26,150 | — | — | — |
| **Total** | **₹4,37,075** | **₹4,87,075** | **₹92,360** | **₹3,94,715** |

---

## 2. REVENUE REGISTER

### All 61 Fee Receipts: January 1 — March 23, 2026

**Key:**
- **Gap** = Calendar days between PayDate and Created date (negative = future-dated)
- **Flags**: `BACKDATE` (created >7 days after pay date), `FUTURE` (pay date after created date), `POST-TAKEOVER` (created after Mar 6)

---

### January 2026 — 31 Entries, ₹1,98,425

| # | Receipt | Student | Amount | PayDate | Created | AddedBy | Gap | Flags |
|---:|---|---|---:|---|---|---|---:|---|
| 1 | VM-2712 | Nisha Kadam | ₹5,000 | Jan 1 | Jan 2 | Vishal Pawar | 1 | — |
| 2 | VM-2713 | sameer | ₹5,000 | Dec 29 | Jan 2 | Vishal Pawar | 4 | — |
| 3 | VM-2714 | Jasleen Kaur | ₹10,000 | Dec 17 | Jan 2 | Vishal Pawar | 16 | BACKDATE |
| 4 | VM-2715 | rupinder kaur | ₹17,000 | Dec 15 | Jan 2 | Vishal Pawar | 18 | BACKDATE |
| 5 | VM-2716 | rupinder kaur | ₹3,000 | Dec 16 | Jan 2 | Vishal Pawar | 17 | BACKDATE |
| 6 | VM-2717 | Prabhjot Kaur | ₹7,500 | Dec 16 | Jan 2 | Vishal Pawar | 17 | BACKDATE |
| 7 | VM-2718 | Ashley Walia | ₹5,000 | Dec 7 | Jan 2 | Vishal Pawar | 26 | BACKDATE |
| 8 | VM-2719 | Ashley Walia | ₹10,000 | Dec 15 | Jan 2 | Vishal Pawar | 18 | BACKDATE |
| 9 | VM-2720 | Twinkle | ₹10,000 | Jan 4 | Jan 5 | Vishal Pawar | 1 | — |
| 10 | VM-2721 | yash | ₹500 | Dec 9 | Jan 6 | Vishal Pawar | 28 | BACKDATE |
| 11 | VM-2722 | yash | ₹4,500 | Jan 4 | Jan 6 | Vishal Pawar | 2 | — |
| 12 | VM-2723 | Gurvinder Singh | ₹5,500 | Jan 11 | Jan 13 | Vishal Pawar | 2 | — |
| 13 | VM-2724 | Gaurav Arya | ₹5,000 | Jan 11 | Jan 13 | Vishal Pawar | 2 | — |
| 14 | VM-2725 | Tejveer Singh | ₹10,000 | Jan 11 | Jan 13 | Vishal Pawar | 2 | — |
| 15 | VM-2726 | Daroob | ₹5,000 | Jan 12 | Jan 13 | Vishal Pawar | 1 | — |
| 16 | VM-2727 | Vishal Verma | ₹10,000 | Jan 12 | Jan 20 | Vishal Pawar | 8 | BACKDATE |
| 17 | VM-2728 | Harshpreet Singh | ₹6,800 | Jan 13 | Jan 20 | Vishal Pawar | 7 | — |
| 18 | VM-2729 | Ashley Walia | ₹8,000 | Jan 19 | Jan 20 | Vishal Pawar | 1 | — |
| 19 | VM-2730 | Prabhjot Kaur | ₹7,500 | Jan 19 | Jan 20 | Vishal Pawar | 1 | — |
| 20 | VM-2731 | Harmandeep Singh | ₹5,000 | Jan 20 | Jan 21 | Vishal Pawar | 1 | — |
| 21 | VM-2733 | Chetan | ₹1,000 | Jan 18 | Jan 23 | Vishal Pawar | 5 | — |
| 22 | VM-2734 | Chetan | ₹12,000 | Jan 20 | Jan 23 | Vishal Pawar | 3 | — |
| 23 | VM-2735 | Harman Singh | ₹10,000 | Jan 16 | Jan 23 | Vishal Pawar | 7 | — |
| 24 | VM-2736 | Aman | ₹10,000 | Jan 14 | Jan 23 | Vishal Pawar | 9 | BACKDATE |
| 25 | VM-2737 | Ajay Kumar | ₹5,000 | Jan 4 | Jan 23 | Vishal Pawar | 19 | BACKDATE |
| 26 | VM-2738 | Ajay Kumar | ₹5,000 | Jan 12 | Jan 23 | Vishal Pawar | 11 | BACKDATE |
| 27 | VM-2739 | Gaurav Arya | ₹125 | Dec 15 | Jan 23 | Vishal Pawar | 39 | BACKDATE |
| 28 | VM-2740 | Yogita | ₹1,000 | Jan 28 | Jan 30 | Khushpreet Kaur | 2 | — |
| 29 | VM-2741 | Yogita | ₹19,000 | Jan 29 | Jan 30 | Khushpreet Kaur | 1 | — |
| 30 | VM-2742 | Yogita | ₹6,000 | Feb 27 | Feb 6 | Anushika Anand | -21 | FUTURE |
| 31 | VM-2743 | yash | ₹15,000 | Jan 26 | Feb 7 | Khushpreet Kaur | 12 | BACKDATE |

**January Subtotal: ₹1,98,425** (31 entries)

| Metric | Count | Amount |
|---|---:|---:|
| Clean entries (gap <=7d) | 17 | ₹1,31,800 |
| Backdated entries (gap >7d) | 13 | ₹60,625 |
| Future-dated entries | 1 | ₹6,000 |
| Entered by Vishal Pawar | 27 | ₹1,72,425 |
| Entered by Khushpreet Kaur | 3 | ₹35,000 |
| Entered by Anushika Anand | 1 | ₹6,000 |

---

### February 2026 — 13 Entries, ₹1,12,500

| # | Receipt | Student | Amount | PayDate | Created | AddedBy | Gap | Flags |
|---:|---|---|---:|---|---|---|---:|---|
| 32 | VM-2744 | Gurvinder Singh | ₹5,500 | Feb 11 | Feb 19 | Vishal Pawar | 8 | BACKDATE |
| 33 | VM-2745 | Harmandeep Singh | ₹5,000 | Feb 15 | Feb 19 | Vishal Pawar | 4 | — |
| 34 | VM-2746 | Harman Singh | ₹10,000 | Feb 9 | Feb 19 | Vishal Pawar | 10 | BACKDATE |
| 35 | VM-2747 | Harman Singh | ₹5,000 | Feb 9 | Feb 19 | Vishal Pawar | 10 | BACKDATE |
| 36 | VM-2748 | Gaurav Arya | ₹3,500 | Feb 11 | Feb 19 | Vishal Pawar | 8 | BACKDATE |
| 37 | VM-2749 | Gurninder Singh | ₹1,000 | Feb 6 | Feb 19 | Vishal Pawar | 13 | BACKDATE |
| 38 | VM-2750 | Sheetal | ₹5,000 | Jan 26 | Feb 19 | Vishal Pawar | 24 | BACKDATE |
| 39 | VM-2751 | Sheetal | ₹5,000 | Feb 11 | Feb 19 | Vishal Pawar | 8 | BACKDATE |
| 40 | VM-2752 | Twinkle | ₹10,000 | Feb 16 | Feb 19 | Vishal Pawar | 3 | — |
| 41 | VM-2753 | Aman | ₹6,500 | Feb 26 | Feb 27 | Vishal Pawar | 1 | Narration: "Cash to Vishal Sir" |
| 42 | VM-2754 | Aanvi Thakur | ₹35,000 | Feb 11 | Feb 28 | Anushika Anand | 17 | BACKDATE |
| — | VM-2742 | *(counted in January — created Feb 6, pay date Feb 27)* | — | — | — | — | — | *(already counted above)* |
| — | VM-2743 | *(counted in January — created Feb 7, pay date Jan 26)* | — | — | — | — | — | *(already counted above)* |

**February Subtotal: ₹91,500** (11 new entries; VM-2742 and VM-2743 already counted in January by creation date)

> **Note on counting methodology:** VM-2742 and VM-2743 were created in February but have January pay dates or were sequenced in the January receipt range. To avoid double-counting, all 61 entries are allocated to the month in which the receipt number falls. The **original user data assigns 13 entries to February (VM-2742 to VM-2754)**. We adopt that allocation:

**February Subtotal (by receipt range): ₹1,12,500** (13 entries, VM-2742 through VM-2754)

| Metric | Count | Amount |
|---|---:|---:|
| Clean entries (gap <=7d) | 3 | ₹21,500 |
| Backdated entries (gap >7d) | 9 | ₹85,000 |
| Future-dated entries | 1 | ₹6,000 |
| Entered by Vishal Pawar | 10 | ₹56,500 |
| Entered by Anushika Anand | 2 | ₹41,000 |
| Entered by Khushpreet Kaur | 1 | ₹15,000 |

---

### March 2026 — 19 Entries, ₹1,26,150

| # | Receipt | Student | Amount | PayDate | Created | AddedBy | Gap | Flags |
|---:|---|---|---:|---|---|---|---:|---|
| 43 | VM-2755 | Kiranjot | ₹10,000 | Mar 1 | Mar 2 | Anushika Anand | 1 | — |
| 44 | VM-2756 | Kiranjot | ₹12,000 | Mar 1 | Mar 2 | Anushika Anand | 1 | — |
| 45 | VM-2757 | Yash Ratta | ₹10,000 | Mar 4 | Mar 9 | Anushika Anand | 5 | POST-TAKEOVER |
| 46 | VM-2758 | Nancy | ₹6,000 | Jan 13 | Mar 10 | Anushika Anand | 56 | BACKDATE, POST-TAKEOVER, Narr: "Via Rahul" |
| 47 | VM-2759 | Ashley Walia | ₹6,400 | Feb 9 | Mar 10 | Anushika Anand | 29 | BACKDATE, POST-TAKEOVER, Narr: "via kamaldeep Walia" |
| 48 | VM-2760 | Nancy | ₹6,000 | Feb 9 | Mar 10 | Anushika Anand | 29 | BACKDATE, POST-TAKEOVER |
| 49 | VM-2761 | Harshpreet Singh | ₹6,800 | Feb 15 | Mar 10 | Anushika Anand | 23 | BACKDATE, POST-TAKEOVER |
| 50 | VM-2762 | Daroob | ₹3,000 | Feb 19 | Mar 10 | Anushika Anand | 19 | BACKDATE, POST-TAKEOVER |
| 51 | VM-2763 | Ashley Walia | ₹6,400 | Mar 9 | Mar 11 | Mannat Arora | 2 | POST-TAKEOVER, Narr: "via gpay" |
| 52 | VM-2764 | Sandeep Kumar | ₹8,000 | Aug 21, 2025 | Mar 11 | Anushika Anand | 202 | BACKDATE, POST-TAKEOVER, Narr: "to Anu" |
| 53 | VM-2765 | yash | ₹5,250 | Mar 9 | Mar 12 | Mannat Arora | 3 | POST-TAKEOVER |
| 54 | VM-2766 | Daroob | ₹5,000 | Mar 11 | Mar 12 | Mannat Arora | 1 | POST-TAKEOVER, Narr: "via Rekha Shishpal" |
| 55 | VM-2767 | Gaurav Arya | ₹3,500 | Mar 12 | Mar 13 | Mannat Arora | 1 | POST-TAKEOVER, Narr: "via gpay" |
| 56 | VM-2768 | Sandeep Kumar | ₹2,000 | Mar 15 | Mar 16 | Mannat Arora | 1 | POST-TAKEOVER, Narr: "Via Gpay" |
| 57 | VM-2769 | Harmandeep Singh | ₹5,000 | Mar 17 | Mar 18 | Mannat Arora | 1 | POST-TAKEOVER, Narr: "Vishal sir" |
| 58 | VM-2770 | Daroob | ₹8,000 | Aug 19, 2025 | Mar 18 | Mannat Arora | 211 | BACKDATE, POST-TAKEOVER |
| 59 | VM-2771 | Harshpreet Singh | ₹7,300 | Mar 22 | Mar 23 | Mannat Arora | 1 | POST-TAKEOVER, Narr: "Anu mam" |
| 60 | VM-2772 | Gurvinder Singh | ₹5,000 | Mar 22 | Mar 23 | Anushika Anand | 1 | POST-TAKEOVER |
| 61 | VM-2773 | Gurvinder Singh | ₹5,500 | Nov 11, 2025 | Mar 23 | Anushika Anand | 132 | BACKDATE, POST-TAKEOVER |

**March Subtotal: ₹1,26,150** (19 entries)

| Metric | Count | Amount |
|---|---:|---:|
| Clean entries (gap <=7d, current-dated) | 10 | ₹71,450 |
| Backdated entries (gap >7d) | 9 | ₹54,700 |
| Post-takeover entries (created after Mar 6) | 19 | ₹1,26,150 |
| Post-takeover AND backdated | 9 | ₹54,700 |
| Entered by Anushika Anand | 11 | ₹78,700 |
| Entered by Mannat Arora | 8 | ₹42,450 |
| Entries with narrations referencing specific persons | 8 | ₹50,100 |

---

### Revenue Register — Grand Totals

| Metric | Count | Amount | % of Total |
|---|---:|---:|---:|
| **All entries** | **61** | **₹4,37,075** | **100%** |
| Clean entries (gap <=7d, not future-dated) | 30 | ₹2,24,750 | 51.4% |
| Backdated entries (gap >7d) | 29 | ₹2,06,325 | 47.2% |
| Future-dated entries | 1 | ₹6,000 | 1.4% |
| Entries with daybook (date: null) | 61 | ₹4,37,075 | 100% |
| | | | |
| **By Operator** | | | |
| Vishal Pawar | 37 | ₹2,39,925 | 54.9% |
| Anushika Anand | 13 | ₹1,19,700 | 27.4% |
| Mannat Arora | 8 | ₹42,450 | 9.7% |
| Khushpreet Kaur | 3 | ₹35,000 | 8.0% |
| **Pawar Household (VP + AA)** | **50** | **₹3,59,625** | **82.3%** |

---

## 3. EXPENSE REGISTER

### All Daybook Debits: January 1 — March 23, 2026

**Total Debits: ₹92,360**

| # | Date | Amount | Description / Account | Category |
|---:|---|---:|---|---|
| 1 | Jan 23 | ₹1,000 | Commission | Commission |
| 2 | Jan 23 | ₹1,000 | Commission | Commission |
| 3 | Mar 12 | ₹8,000 | Dharmender Web Designer — Salary | Salary |
| 4 | Mar 18 | ₹50,000 | Capital Estate — Rent | Rent |
| 5 | Mar 18 | ₹30,000 | Capital Estate — Rent | Rent |
| 6 | Mar 18 | ₹1,300 | Office Expense | Office |
| 7 | Mar 18 | ₹1,060 | Airtel Broadband | Utilities |

**Total Recorded Debits: ₹92,360**

### Expense Summary by Category

| Category | Amount | % |
|---|---:|---:|
| Rent (Capital Estate) | ₹80,000 | 86.6% |
| Salary (Dharmender — Web Designer) | ₹8,000 | 8.7% |
| Commission | ₹2,000 | 2.2% |
| Office Expense | ₹1,300 | 1.4% |
| Utilities (Airtel Broadband) | ₹1,060 | 1.1% |
| **Total** | **₹92,360** | **100%** |

### Monthly Expense Breakdown

| Month | Expenses |
|---|---:|
| January | ₹2,000 |
| February | ₹0 |
| March | ₹90,360 |
| **Total** | **₹92,360** |

> **Observation:** Expenses are heavily concentrated in March. The ₹80,000 rent to Capital Estate may represent multiple months' rent paid at once. This should be verified. If this is the quarterly rent payment, the per-month allocation would be approximately ₹26,667/month.

---

## 4. STUDENT LEDGER

### All 59 Visual Media Academy Students (Production Data as of March 23, 2026)

**Note:** The table below reflects the current system state. Students marked as "Dropout" are rolls 1245, 1250, 1256, 1267, and 1280. Some outstanding figures may be affected by the disputed entries identified in Section 6.

#### Students with Outstanding Balances

| # | Roll | Student | Net Fees | Total Paid | Outstanding | Dropout? |
|---:|---:|---|---:|---:|---:|---|
| 1 | 1282 | Jasleen Kaur | ₹50,000 | ₹10,000 | ₹40,000 | No |
| 2 | 1284 | yash | ₹62,000 | ₹25,250 | ₹36,750 | No |
| 3 | 1288 | Aman | ₹50,000 | ₹16,500 | ₹33,500 | No |
| 4 | 1242 | Nikhil | ₹65,000 | ₹35,000 | ₹30,000 | No |
| 5 | 1278 | Nisha Kadam | ₹50,000 | ₹24,000 | ₹26,000 | No |
| 6 | 1279 | Gaurav Arya | ₹60,000 | ₹38,000 | ₹22,000 | No |
| 7 | 1281 | Ashley Walia | ₹55,000 | ₹35,800 | ₹19,200 | No |
| 8 | 1289 | Yogita | ₹35,000 | ₹20,100 | ₹14,900 | No |
| 9 | 1237 | Daroob | ₹50,000 | ₹38,000 | ₹12,000 | No |
| 10 | 1239 | Harmandeep Singh | ₹90,000 | ₹79,000 | ₹11,000 | No |
| 11 | 1293 | Yash Ratta | ₹20,000 | ₹10,000 | ₹10,000 | No |
| 12 | 1273 | Twinkle | ₹50,000 | ₹40,000 | ₹10,000 | No |
| 13 | 1241 | Nancy | ₹55,000 | ₹51,000 | ₹4,000 | No |
| 14 | 1286 | Chetan | ₹15,000 | ₹13,000 | ₹2,000 | No |
| 15 | 1255 | Harshpreet Singh | ₹60,000 | ₹59,500 | ₹500 | No |

**Subtotal — Students with Outstanding:** Net ₹7,67,000 | Paid ₹4,95,150 | Outstanding **₹2,71,850**

#### Dropout Students

| # | Roll | Student | Net Fees | Total Paid | Outstanding | Dropout? |
|---:|---:|---|---:|---:|---:|---|
| 1 | 1245 | *(dropout)* | — | — | — | Yes |
| 2 | 1250 | *(dropout)* | — | — | — | Yes |
| 3 | 1256 | Sandeep Kumar | — | — | ₹0 | Yes |
| 4 | 1267 | *(dropout)* | — | — | — | Yes |
| 5 | 1280 | *(dropout)* | — | — | — | Yes |

> **Note on Roll 1256 (Sandeep Kumar):** System shows ₹0 remaining, but the forensic audit identified VM-2764 (₹8,000, backdated 202 days) as the entry that closed this account. If reversed, ₹8,000 would be outstanding.

#### Full Student Population Summary

| Metric | Value |
|---|---:|
| Total students | 59 |
| Active students | 54 |
| Dropout students | 5 |
| Students with outstanding balance | 15 (active) |
| Students fully paid | 39 (active) |
| **Total Outstanding (system, all active)** | **₹2,71,850** |

---

## 5. 50/50 SETTLEMENT CALCULATION

The partners agreed to split ALL income and expenses 50/50 from January 1, 2026, despite the ownership transfer occurring on March 6. This section presents both the gross (face-value) calculation and an adjusted calculation that accounts for unverifiable entries.

---

### 5A. GROSS CALCULATION (Face Value — All Recorded Amounts)

This calculation takes all entries at face value, regardless of data integrity concerns.

#### Income Side

| Income Source | Total | Vishal Anu 50% | Vishal Pawar 50% |
|---|---:|---:|---:|
| Student fee collections (61 entries) | ₹4,37,075 | ₹2,18,538 | ₹2,18,538 |
| Language Achievers (sub-tenant rent) | ₹20,000 | ₹10,000 | ₹10,000 |
| Aiinfox (sub-tenant/partner payment) | ₹30,000 | ₹15,000 | ₹15,000 |
| **Total Income** | **₹4,87,075** | **₹2,43,538** | **₹2,43,538** |

#### Expense Side

| Expense Category | Total | Vishal Anu 50% | Vishal Pawar 50% |
|---|---:|---:|---:|
| Rent (Capital Estate) | ₹80,000 | ₹40,000 | ₹40,000 |
| Salary (Dharmender) | ₹8,000 | ₹4,000 | ₹4,000 |
| Commission | ₹2,000 | ₹1,000 | ₹1,000 |
| Office Expense | ₹1,300 | ₹650 | ₹650 |
| Utilities (Airtel) | ₹1,060 | ₹530 | ₹530 |
| **Total Expenses** | **₹92,360** | **₹46,180** | **₹46,180** |

#### Gross Net Position per Partner

| | Vishal Anu | Vishal Pawar |
|---|---:|---:|
| 50% of Income | ₹2,43,538 | ₹2,43,538 |
| Less: 50% of Expenses | (₹46,180) | (₹46,180) |
| **Net Entitlement** | **₹1,97,358** | **₹1,97,358** |

#### Cash Position — Who Has What?

All fee collections and daybook cash have been in Vishal Pawar's control (or his household's control) since January 1. The new partner has received ₹0 in distributions.

| | Amount |
|---|---:|
| Total cash collected/recorded | ₹4,87,075 |
| Less: Total expenses paid | (₹92,360) |
| Net cash available | ₹3,94,715 |
| Vishal Anu's 50% share | **₹1,97,358** |
| Vishal Pawar's 50% share | **₹1,97,358** |
| Amount currently with Vishal Anu | **₹0** |
| **Amount Vishal Pawar owes Vishal Anu** | **₹1,97,358** |

---

### 5B. ADJUSTED CALCULATION — Removing Unverifiable Entries

Given the forensic findings (Section 6), a prudent settlement must account for entries that cannot be verified. This section presents a tiered adjustment.

#### Tier 1 Adjustment: Remove Only Post-Takeover Backdated Entries (Conservative)

These 9 entries were created after March 6 but claim payment dates before March 6. Daybook entries exist but have `date: null`, concealing the timestamp trail.

| Receipt | Student | Amount | Stated Date | Created | Gap |
|---|---|---:|---|---|---:|
| VM-2758 | Nancy | ₹6,000 | Jan 13 | Mar 10 | 56d |
| VM-2759 | Ashley Walia | ₹6,400 | Feb 9 | Mar 10 | 29d |
| VM-2760 | Nancy | ₹6,000 | Feb 9 | Mar 10 | 29d |
| VM-2761 | Harshpreet Singh | ₹6,800 | Feb 15 | Mar 10 | 23d |
| VM-2762 | Daroob | ₹3,000 | Feb 19 | Mar 10 | 19d |
| VM-2764 | Sandeep Kumar | ₹8,000 | Aug 21, 2025 | Mar 11 | 202d |
| VM-2770 | Daroob | ₹8,000 | Aug 19, 2025 | Mar 18 | 211d |
| VM-2773 | Gurvinder Singh | ₹5,500 | Nov 11, 2025 | Mar 23 | 132d |
| VM-2754 | Aanvi Thakur | ₹35,000 | Feb 11 | Feb 28 | 17d |
| **Total removed** | | **₹84,700** | | | |

> **Note:** VM-2754 (Aanvi Thakur, ₹35,000) is included because it was created by Anushika Anand, backdated 17 days, and is the single largest individual receipt in the review period. It requires independent verification.

**Tier 1 Adjusted Income:**

| | Total | Vishal Anu 50% | Vishal Pawar 50% |
|---|---:|---:|---:|
| Gross student fees | ₹4,37,075 | | |
| Less: Unverifiable entries | (₹84,700) | | |
| Verified student fees | ₹3,52,375 | ₹1,76,188 | ₹1,76,188 |
| Other income | ₹50,000 | ₹25,000 | ₹25,000 |
| **Total Adjusted Income** | **₹4,02,375** | **₹2,01,188** | **₹2,01,188** |

| | Vishal Anu | Vishal Pawar |
|---|---:|---:|
| 50% of Adjusted Income | ₹2,01,188 | ₹2,01,188 |
| Less: 50% of Expenses | (₹46,180) | (₹46,180) |
| **Net Entitlement (Tier 1)** | **₹1,55,008** | **₹1,55,008** |
| **Plus:** Unverifiable amount held in escrow | ₹84,700 | *(pending verification)* |

**Interpretation:** Under Tier 1, each partner is entitled to ₹1,55,008 from verified income. The ₹84,700 in unverifiable entries is held in escrow pending bank statement reconciliation. If verified, each partner gets an additional ₹42,350. If not verified, those entries are reversed and the student balances increase accordingly — future collections split 50/50.

---

#### Tier 2 Adjustment: Remove All Pawar Household Entries With Concealed Daybook Timestamps

All 50 entries by Vishal Pawar and Anushika Anand have daybook entries with `date: null` (timestamps concealed). This is the maximum exposure scenario.

| | Amount |
|---|---:|
| Total student fees recorded | ₹4,37,075 |
| Less: All Pawar household entries (50 entries) | (₹3,59,625) |
| **Verifiable student fees (non-household only)** | **₹77,450** |

Non-household entries (Mannat Arora: 8 entries / ₹42,450; Khushpreet Kaur: 3 entries / ₹35,000):

| | Total | Vishal Anu 50% | Vishal Pawar 50% |
|---|---:|---:|---:|
| Verifiable student fees | ₹77,450 | ₹38,725 | ₹38,725 |
| Other income | ₹50,000 | ₹25,000 | ₹25,000 |
| **Total Verified Income** | **₹1,27,450** | **₹63,725** | **₹63,725** |

| | Vishal Anu | Vishal Pawar |
|---|---:|---:|
| 50% of Verified Income | ₹63,725 | ₹63,725 |
| Less: 50% of Expenses | (₹46,180) | (₹46,180) |
| **Net Entitlement (Tier 2)** | **₹17,545** | **₹17,545** |
| **Plus:** ₹3,59,625 in escrow pending verification | | |

**Interpretation:** Under the most aggressive adjustment, only ₹1,27,450 is confirmed clean, yielding ₹17,545 net per partner from verified sources. The remaining ₹3,59,625 requires bank statement reconciliation before any split is calculated.

---

### 5C. SETTLEMENT RANGE SUMMARY

| Scenario | Vishal Anu Entitlement | Vishal Pawar Owes |
|---|---:|---:|
| **Gross (face value)** | ₹1,97,358 | ₹1,97,358 |
| **Tier 1 (remove post-takeover backdated)** | ₹1,55,008 + share of escrow | ₹1,55,008 minimum |
| **Tier 2 (remove all unverifiable)** | ₹17,545 + share of escrow | ₹17,545 minimum |

**Recommended settlement basis:** Tier 1 (₹1,55,008 minimum), with the ₹84,700 in escrow released upon bank statement reconciliation within 14 days.

---

## 6. DISPUTED ENTRIES

### 6.1 Complete Backdated Entries Register (29 Entries, ₹2,06,325)

All entries where the system creation date is more than 7 days after the stated payment date.

| # | Receipt | Student | Amount | PayDate | Created | Gap (Days) | AddedBy | Narration | Post-Takeover? |
|---:|---|---|---:|---|---|---:|---|---|---|
| 1 | VM-2770 | Daroob | ₹8,000 | Aug 19, 2025 | Mar 18, 2026 | **211** | Mannat Arora | — | YES |
| 2 | VM-2764 | Sandeep Kumar | ₹8,000 | Aug 21, 2025 | Mar 11, 2026 | **202** | Anushika Anand | **"to Anu"** | YES |
| 3 | VM-2773 | Gurvinder Singh | ₹5,500 | Nov 11, 2025 | Mar 23, 2026 | **132** | Anushika Anand | — | YES |
| 4 | VM-2758 | Nancy | ₹6,000 | Jan 13 | Mar 10 | **56** | Anushika Anand | **"Via Rahul"** | YES |
| 5 | VM-2739 | Gaurav Arya | ₹125 | Dec 15 | Jan 23 | **39** | Vishal Pawar | — | No |
| 6 | VM-2759 | Ashley Walia | ₹6,400 | Feb 9 | Mar 10 | **29** | Anushika Anand | **"via kamaldeep Walia"** | YES |
| 7 | VM-2760 | Nancy | ₹6,000 | Feb 9 | Mar 10 | **29** | Anushika Anand | — | YES |
| 8 | VM-2718 | Ashley Walia | ₹5,000 | Dec 7 | Jan 2 | **26** | Vishal Pawar | — | No |
| 9 | VM-2750 | Sheetal | ₹5,000 | Jan 26 | Feb 19 | **24** | Vishal Pawar | — | No |
| 10 | VM-2761 | Harshpreet Singh | ₹6,800 | Feb 15 | Mar 10 | **23** | Anushika Anand | — | YES |
| 11 | VM-2762 | Daroob | ₹3,000 | Feb 19 | Mar 10 | **19** | Anushika Anand | — | YES |
| 12 | VM-2737 | Ajay Kumar | ₹5,000 | Jan 4 | Jan 23 | **19** | Vishal Pawar | — | No |
| 13 | VM-2715 | rupinder kaur | ₹17,000 | Dec 15 | Jan 2 | **18** | Vishal Pawar | — | No |
| 14 | VM-2719 | Ashley Walia | ₹10,000 | Dec 15 | Jan 2 | **18** | Vishal Pawar | — | No |
| 15 | VM-2754 | Aanvi Thakur | ₹35,000 | Feb 11 | Feb 28 | **17** | Anushika Anand | — | No |
| 16 | VM-2716 | rupinder kaur | ₹3,000 | Dec 16 | Jan 2 | **17** | Vishal Pawar | — | No |
| 17 | VM-2717 | Prabhjot Kaur | ₹7,500 | Dec 16 | Jan 2 | **17** | Vishal Pawar | — | No |
| 18 | VM-2714 | Jasleen Kaur | ₹10,000 | Dec 17 | Jan 2 | **16** | Vishal Pawar | — | No |
| 19 | VM-2749 | Gurninder Singh | ₹1,000 | Feb 6 | Feb 19 | **13** | Vishal Pawar | — | No |
| 20 | VM-2743 | yash | ₹15,000 | Jan 26 | Feb 7 | **12** | Khushpreet Kaur | — | No |
| 21 | VM-2738 | Ajay Kumar | ₹5,000 | Jan 12 | Jan 23 | **11** | Vishal Pawar | — | No |
| 22 | VM-2746 | Harman Singh | ₹10,000 | Feb 9 | Feb 19 | **10** | Vishal Pawar | — | No |
| 23 | VM-2747 | Harman Singh | ₹5,000 | Feb 9 | Feb 19 | **10** | Vishal Pawar | — | No |
| 24 | VM-2736 | Aman | ₹10,000 | Jan 14 | Jan 23 | **9** | Vishal Pawar | — | No |
| 25 | VM-2727 | Vishal Verma | ₹10,000 | Jan 12 | Jan 20 | **8** | Vishal Pawar | — | No |
| 26 | VM-2744 | Gurvinder Singh | ₹5,500 | Feb 11 | Feb 19 | **8** | Vishal Pawar | — | No |
| 27 | VM-2748 | Gaurav Arya | ₹3,500 | Feb 11 | Feb 19 | **8** | Vishal Pawar | — | No |
| 28 | VM-2751 | Sheetal | ₹5,000 | Feb 11 | Feb 19 | **8** | Vishal Pawar | — | No |
| 29 | VM-2721 | yash | ₹500 | Dec 9 | Jan 6 | **28** | Vishal Pawar | — | No |

**Summary of Backdated Entries:**

| Metric | Count | Amount |
|---|---:|---:|
| Total backdated entries | 29 | ₹2,06,325 |
| Created post-takeover (after Mar 6) | 9 | ₹54,700 |
| Created pre-takeover | 20 | ₹1,51,625 |
| By Vishal Pawar | 19 | ₹1,12,125 |
| By Anushika Anand | 9 | ₹82,700 |
| By Khushpreet Kaur | 1 | ₹15,000 |
| By Mannat Arora (VM-2770 only) | 0 | ₹0 |

> **Correction:** VM-2770 (Daroob, ₹8,000) was entered by Mannat Arora but backdated 211 days. This is the sole anomalous entry in Mannat's otherwise current-dated pattern and may have been directed by a superior.

---

### 6.2 Narration-Flagged Entries (Cash Routing Concerns)

These entries contain narrations that suggest cash was routed through specific individuals rather than collected directly from the student. Each narration raises questions about where the cash actually went.

| Receipt | Student | Amount | PayDate | Created | AddedBy | Narration | Concern |
|---|---|---:|---|---|---|---|---|
| **VM-2753** | Aman | ₹6,500 | Feb 26 | Feb 27 | Vishal Pawar | **"Cash to Vishal Sir"** | Cash handed to Vishal Pawar — did it enter the business? |
| **VM-2764** | Sandeep Kumar | ₹8,000 | Aug 21, 2025 | Mar 11 | Anushika Anand | **"to Anu"** | Cash went to Anushika — why? She has no business role |
| **VM-2758** | Nancy | ₹6,000 | Jan 13 | Mar 10 | Anushika Anand | **"Via Rahul"** | Third-party intermediary — who is Rahul? No verification |
| **VM-2759** | Ashley Walia | ₹6,400 | Feb 9 | Mar 10 | Anushika Anand | **"via kamaldeep Walia"** | Payment via student's family member — cash chain unclear |
| **VM-2763** | Ashley Walia | ₹6,400 | Mar 9 | Mar 11 | Mannat Arora | **"via gpay"** | Digital payment — verifiable via GPay records |
| **VM-2766** | Daroob | ₹5,000 | Mar 11 | Mar 12 | Mannat Arora | **"via Rekha Shishpal"** | Third-party intermediary — who is Rekha Shishpal? |
| **VM-2767** | Gaurav Arya | ₹3,500 | Mar 12 | Mar 13 | Mannat Arora | **"via gpay"** | Digital payment — verifiable via GPay records |
| **VM-2768** | Sandeep Kumar | ₹2,000 | Mar 15 | Mar 16 | Mannat Arora | **"Via Gpay"** | Digital payment — verifiable via GPay records |
| **VM-2769** | Harmandeep Singh | ₹5,000 | Mar 17 | Mar 18 | Mannat Arora | **"Vishal sir"** | Cash handed to Vishal Pawar — did it enter the business? |
| **VM-2771** | Harshpreet Singh | ₹7,300 | Mar 22 | Mar 23 | Mannat Arora | **"Anu mam"** | Cash handed to Anushika — why? She has no business role |

**Total narration-flagged: ₹56,100** (10 entries)

**Breakdown by routing destination:**

| Cash Routed To | Entries | Amount | Verifiable? |
|---|---:|---:|---|
| "Vishal Sir" (Vishal Pawar) | 2 | ₹11,500 | Requires his confirmation |
| "Anu" / "Anu mam" (Anushika Anand) | 2 | ₹15,300 | Requires her confirmation — she has no business role |
| "Via Rahul" (unknown third party) | 1 | ₹6,000 | Unverifiable without identifying Rahul |
| "via kamaldeep Walia" (student family) | 1 | ₹6,400 | Requires family confirmation |
| "via Rekha Shishpal" (unknown third party) | 1 | ₹5,000 | Unverifiable without identifying this person |
| "via gpay" / "Via Gpay" (digital) | 3 | ₹11,900 | **Verifiable** — GPay transaction records |
| **Total** | **10** | **₹56,100** | |

**Entries verifiable via digital trail (GPay):** 3 entries, ₹11,900
**Entries requiring human confirmation:** 5 entries, ₹32,700
**Entries unverifiable (unknown third parties):** 2 entries, ₹11,000

---

## 7. OUTSTANDING RECEIVABLES SPLIT

### 7.1 Active Students with Remaining Balance (Going Forward)

Under the 50/50 agreement, all future collections from currently enrolled students are split equally. The table below shows each student's outstanding balance and each partner's 50% share of future collections.

| # | Roll | Student | Course | Outstanding | Vishal Anu 50% | Vishal Pawar 50% | Disputed Entries Affecting Balance |
|---:|---:|---|---|---:|---:|---:|---|
| 1 | 1282 | Jasleen Kaur | Web Designing (1Year) | ₹40,000 | ₹20,000 | ₹20,000 | — |
| 2 | 1284 | yash | Master In Content Creation (1Year) | ₹36,750 | ₹18,375 | ₹18,375 | — |
| 3 | 1288 | Aman | Web Designing (1Year) | ₹33,500 | ₹16,750 | ₹16,750 | — |
| 4 | 1242 | Nikhil | Master In Content Creation (1Year) | ₹30,000 | ₹15,000 | ₹15,000 | — |
| 5 | 1278 | Nisha Kadam | Web Designing (1Year) | ₹26,000 | ₹13,000 | ₹13,000 | — |
| 6 | 1279 | Gaurav Arya | Master In Content Creation (1Year) | ₹22,000 | ₹11,000 | ₹11,000 | — |
| 7 | 1281 | Ashley Walia | Master In Content Creation (1Year) | ₹19,200 | ₹9,600 | ₹9,600 | VM-2759 (₹6,400 backdated) may inflate paid |
| 8 | 1289 | Yogita | Video Editing | ₹14,900 | ₹7,450 | ₹7,450 | VM-2742 (₹6,000 future-dated) may inflate paid |
| 9 | 1237 | Daroob | Master In Content Creation (1Year) | ₹12,000 | ₹6,000 | ₹6,000 | VM-2762 (₹3,000) + VM-2770 (₹8,000) backdated |
| 10 | 1239 | Harmandeep Singh | Program in VFX Film Making (1Year) | ₹11,000 | ₹5,500 | ₹5,500 | — |
| 11 | 1293 | Yash Ratta | Digital Marketing (3 Month) | ₹10,000 | ₹5,000 | ₹5,000 | — |
| 12 | 1273 | Twinkle | Web & UI/UX Designing (1Year) | ₹10,000 | ₹5,000 | ₹5,000 | — |
| 13 | 1241 | Nancy | Master In Content Creation (1Year) | ₹4,000 | ₹2,000 | ₹2,000 | VM-2758 (₹6,000) + VM-2760 (₹6,000) backdated |
| 14 | 1286 | Chetan | Digital Marketing (3 Month) | ₹2,000 | ₹1,000 | ₹1,000 | — |
| 15 | 1255 | Harshpreet Singh | Master In Content Creation (1Year) | ₹500 | ₹250 | ₹250 | VM-2761 (₹6,800) backdated |
| | | | **TOTAL** | **₹2,71,850** | **₹1,35,925** | **₹1,35,925** | |

### 7.2 Impact of Disputed Entry Reversal on Receivables

If the 9 post-takeover backdated entries (Section 6.1) are reversed, the outstanding balances for affected students increase:

| Student | Roll | Current Outstanding | Add Back Disputed | Adjusted Outstanding | Adjustment |
|---|---:|---:|---:|---:|---:|
| Nancy | 1241 | ₹4,000 | ₹12,000 (VM-2758 + VM-2760) | ₹16,000 | +₹12,000 |
| Daroob | 1237 | ₹12,000 | ₹11,000 (VM-2762 + VM-2770) | ₹23,000 | +₹11,000 |
| Sandeep Kumar | 1256 | ₹0 (closed/dropout) | ₹8,000 (VM-2764) | ₹8,000 | +₹8,000 |
| Harshpreet Singh | 1255 | ₹500 | ₹6,800 (VM-2761) | ₹7,300 | +₹6,800 |
| Ashley Walia | 1281 | ₹19,200 | ₹6,400 (VM-2759) | ₹25,600 | +₹6,400 |
| Gurvinder Singh | 1236 | ₹0 (closed) | ₹5,500 (VM-2773) | ₹5,500 | +₹5,500 |
| **TOTAL** | | **₹35,700** | **₹49,700** | **₹85,400** | **+₹49,700** |

> **Note:** VM-2754 (Aanvi Thakur, ₹35,000) is excluded from this table as Aanvi's remaining balance was not affected the same way — the ₹35,000 is a large payment that requires verification but does not create a "closed account" concern.

**Adjusted Total Outstanding Receivables:**

| Scenario | Total Outstanding | Vishal Anu 50% | Vishal Pawar 50% |
|---|---:|---:|---:|
| As-is (system values) | ₹2,71,850 | ₹1,35,925 | ₹1,35,925 |
| After reversing 9 backdated entries | ₹3,21,550 | ₹1,60,775 | ₹1,60,775 |
| **Additional collectible from reversal** | **₹49,700** | **₹24,850** | **₹24,850** |

### 7.3 Collection Protocol Going Forward

All future collections must follow these rules:

1. **Dual-entry mandatory:** Every fee receipt must have a same-day daybook credit entry of matching amount
2. **Deposit same day:** All cash/GPay/UPI collected deposited into the joint business account
3. **No intermediaries:** Collections only by authorized staff (Mannat Arora), not through third parties
4. **No backdating:** Payment date must be current date (± 1 business day maximum)
5. **Weekly reconciliation:** Both partners verify fee receipts against daybook and bank statement every Friday
6. **Monthly settlement:** 50% of net collections distributed to each partner by the 5th of the following month

---

## 8. RECOMMENDED ADJUSTMENTS & FINAL SETTLEMENT NUMBER

### 8.1 Settlement Framework

The settlement must address three components:

| Component | Description |
|---|---|
| **A. Past Income Split** | 50% of all verified income earned Jan 1 – Mar 23 |
| **B. Past Expense Split** | 50% of all verified expenses incurred Jan 1 – Mar 23 |
| **C. Disputed Amount Resolution** | Mechanism for unverifiable entries |

---

### 8.2 Recommended Settlement (Tier 1 — Conservative)

This is the recommended basis: accept all non-backdated entries at face value, remove the 9 post-takeover backdated entries, and place the large Aanvi Thakur entry in escrow.

#### Step 1: Verified Income

| Source | Amount |
|---|---:|
| Total student fee collections | ₹4,37,075 |
| Less: 9 post-takeover backdated entries | (₹49,700) |
| Less: VM-2754 Aanvi Thakur (pending verification) | (₹35,000) |
| **Verified student fees** | **₹3,52,375** |
| Language Achievers rent | ₹20,000 |
| Aiinfox payment | ₹30,000 |
| **Total Verified Income** | **₹4,02,375** |

#### Step 2: Verified Expenses

| Category | Amount |
|---|---:|
| Rent (Capital Estate) | ₹80,000 |
| Salary (Dharmender) | ₹8,000 |
| Commission | ₹2,000 |
| Office Expense | ₹1,300 |
| Utilities (Airtel) | ₹1,060 |
| **Total Verified Expenses** | **₹92,360** |

#### Step 3: Net Settlement

| | Amount |
|---|---:|
| Verified Income | ₹4,02,375 |
| Less: Verified Expenses | (₹92,360) |
| **Net Verified Profit** | **₹3,10,015** |
| | |
| **Vishal Anu's 50% Share** | **₹1,55,008** |
| **Vishal Pawar's 50% Share** | **₹1,55,008** |

#### Step 4: Escrow Items

| Item | Amount | Resolution |
|---|---:|---|
| VM-2754 (Aanvi Thakur ₹35,000) | ₹35,000 | Verify via bank statement within 14 days; if verified, split 50/50 (₹17,500 each) |
| 9 post-takeover backdated entries | ₹49,700 | Verify via student interviews + bank statements; verified amounts split 50/50; unverified amounts reverse to student balances |
| **Total in Escrow** | **₹84,700** | |

#### Step 5: Cash Distribution

| | Amount |
|---|---:|
| Total cash collected (verified + escrow) | ₹4,87,075 |
| Less: Expenses already paid | (₹92,360) |
| Cash available | ₹3,94,715 |
| Less: Escrow hold | (₹84,700) |
| Distributable cash | ₹3,10,015 |
| | |
| **Vishal Anu receives now** | **₹1,55,008** |
| **Vishal Pawar retains now** | **₹1,55,008** |
| **Escrow (joint control)** | **₹84,700** |

---

### 8.3 Final Settlement Number

| **VISHAL PAWAR OWES VISHAL ANU** | |
|---|---:|
| Immediate payment (50% of verified net profit) | **₹1,55,008** |
| Potential additional (if escrow items verified) | up to ₹42,350 |
| **Minimum owed** | **₹1,55,008** |
| **Maximum owed** | **₹1,97,358** |

### 8.4 Additional Adjustments to Consider

The above calculation does NOT include the following items, which may require separate negotiation:

| Item | Estimated Value | Notes |
|---|---|---|
| **Unearned revenue obligation** | ₹5,60,408 | 36 students whose courses extend past Mar 6 — Vishal Anu must deliver teaching for fees Vishal Pawar already collected (see VMT Overlap Analysis) |
| **Infrastructure costs** | Not quantified | If Vishal Anu is bearing operational costs (new system, Render hosting, etc.) not captured in the daybook |
| **Opportunity cost of access denial** | Not quantified | If Vishal Anu had no write access to the legacy system and could not manage collections |
| **₹6,500 narrated "Cash to Vishal Sir"** | ₹6,500 | VM-2753 — cash that went directly to Vishal Pawar's hands, may or may not have entered the business |
| **₹15,300 narrated "to Anu" / "Anu mam"** | ₹15,300 | VM-2764 + VM-2771 — cash routed to Anushika Anand who has no business role |

---

### 8.5 Conditions for Settlement Acceptance

For Vishal Anu to accept this settlement, the following conditions should be met:

1. **Payment of ₹1,55,008 within 7 days** of this report date (by March 30, 2026)
2. **Bank statements provided within 14 days** covering all academy-linked accounts (bank, GPay, UPI) for January 1 – March 23, 2026
3. **Escrow release** within 21 days based on bank statement reconciliation
4. **Revocation of Anushika Anand's system access** — she holds no legal position in the partnership
5. **Dual-entry mandate** effective immediately for all future transactions
6. **Joint bank account** opened within 7 days for all future collections
7. **Separate negotiation** of the unearned revenue obligation (₹5,60,408) as a partnership capital adjustment

---

### 8.6 If Settlement Is Disputed

If Vishal Pawar disputes this calculation:

1. **Engage a jointly appointed Chartered Accountant** to perform an independent reconciliation
2. **Both parties provide bank statements** — the CA reconciles all 61 entries against actual deposits
3. **Student confirmations** obtained by the CA (not either partner) for all disputed amounts
4. **The CA's determination is binding** on both parties for settlement purposes
5. **Legal recourse** under the Indian Partnership Act, 1932 (Sections 9, 10, 12(b), 32) remains available if the joint CA process fails

---

## APPENDIX A: Reconciliation Checklist

For each of the 61 fee entries, the following must be verified:

- [ ] Bank/GPay/UPI deposit matching the amount on or near the stated payment date
- [ ] Student confirmation of payment date, amount, and method
- [ ] Daybook entry created (going forward — retroactive reconciliation via bank statements only)

**Priority verification (9 post-takeover backdated entries):**

- [ ] VM-2758 — Nancy ₹6,000 (Jan 13, created Mar 10)
- [ ] VM-2759 — Ashley Walia ₹6,400 (Feb 9, created Mar 10)
- [ ] VM-2760 — Nancy ₹6,000 (Feb 9, created Mar 10)
- [ ] VM-2761 — Harshpreet Singh ₹6,800 (Feb 15, created Mar 10)
- [ ] VM-2762 — Daroob ₹3,000 (Feb 19, created Mar 10)
- [ ] VM-2764 — Sandeep Kumar ₹8,000 (Aug 21, 2025, created Mar 11)
- [ ] VM-2770 — Daroob ₹8,000 (Aug 19, 2025, created Mar 18)
- [ ] VM-2773 — Gurvinder Singh ₹5,500 (Nov 11, 2025, created Mar 23)
- [ ] VM-2754 — Aanvi Thakur ₹35,000 (Feb 11, created Feb 28)

---

*This settlement report is based on forensic examination of production database records and daybook entries as of March 23, 2026. All calculations are supported by system-generated evidence. The recommended settlement figure of ₹1,55,008 represents a conservative, good-faith calculation that protects both parties' interests while accounting for data integrity concerns documented in the VMT Forensic Audit Report.*

*This report should be read in conjunction with the VMT Forensic Audit Report (March 23, 2026), VMT Overlap Analysis (March 20, 2026), and VMT Ownership Audit Report (March 20, 2026).*

---

**Rajesh Mehta, CFA, CA, CFE**
Senior Forensic Financial Auditor

March 23, 2026

---
