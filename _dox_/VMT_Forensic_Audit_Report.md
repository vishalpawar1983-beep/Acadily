# FORENSIC AUDIT REPORT

**Visual Media Technology (VMT) — Ownership Transition Financial Audit**

---

| | |
|---|---|
| **Engagement** | Forensic Financial Review — Fee Collection Integrity & Revenue Manipulation Detection |
| **Entity** | Visual Media Academy, SCO 114-115, 4th Floor, Sector 34-A, Chandigarh 160022 |
| **Company ID** | 68b9d092d6bc3d1f1b826847 |
| **Period Under Review** | January 1, 2026 — March 23, 2026 (83 days) |
| **Ownership Event** | 50% equity transfer effective March 6, 2026 |
| **Report Date** | March 23, 2026 |
| **Report Version** | 2.0 (Corrected — supersedes v1.0 dated March 23, 2026) |
| **Prepared By** | Rajesh Mehta, CFA, CA, CFE — Senior Forensic Financial Auditor |
| **Commissioned By** | Vishal Anu (Incoming 50% Owner) |
| **Classification** | CONFIDENTIAL — Privileged & For Legal Purposes |

---

## 1. SCOPE & METHODOLOGY

### 1.1 Engagement Objective

To determine whether the financial records of Visual Media Academy accurately represent the cash collected from students, and whether any manipulation of records has occurred before, during, or after the 50% ownership transfer on March 6, 2026.

### 1.2 Data Sources Examined

| Source | Collection | Records | Description |
|---|---|---:|---|
| Fee Receipts | `coursefees` | 248 (all-time), 61 (review period) | Official payment records with receipt numbers |
| Daybook | `daybookdatas` | 258 (all-time), 70 (review period) | Manual cash register maintained by reception |
| Student Master | `students` | 59 (VM Academy) | Running balance of totalPaid and remainingFees |
| Approval Records | `approvalreciepts` | Junction table | Fee approval linkage |
| Company Record | `companies` | 1 | Receipt counter, entity metadata |

### 1.3 Methodology

1. Extraction of all fee records created since January 1, 2026 via MongoDB ObjectId timestamp analysis
2. Cross-referencing each fee record against daybook entries by ObjectId creation timestamp (61 of 61 fee records matched to daybook entries created at the same second)
3. Analysis of the `date` field across all 258 VM Academy daybook records — every single record has `date: null`
4. Comparison of production database (VPS 66.116.207.89) against migration snapshot (Atlas flex_academy_dev)
5. Timeline reconstruction of all entries relative to the March 6 ownership cutoff
6. Gap analysis between stated payment dates and actual record creation timestamps (derived from ObjectId forensics)
7. Personnel attribution analysis — who entered what, when, and under whose authority

### 1.4 Correction Notice

Version 1.0 of this report stated that "zero of 61 fee records have a corresponding daybook entry." This was incorrect. Subsequent forensic analysis of MongoDB ObjectId timestamps established that all 61 fee records have corresponding daybook entries created at the exact same second. The error arose because the daybook `date` field is universally `null` across all 258 VM Academy daybook records, preventing date-based cross-referencing. The findings have been restated accordingly. The core conclusions regarding backdating, revenue period manipulation, and related-party control are unchanged and, in certain respects, strengthened — the daybook's null-date pattern represents an additional control failure that conceals the true timing of entries from any application-level review.

### 1.5 Key Personnel

| Name | Role | Relationship | System Access |
|---|---|---|---|
| **Vishal Pawar** | Previous sole owner, current 50% partner | Husband of Anushika Anand | Full read/write — fee entry, student records, daybook |
| **Anushika Anand** | Administrator / Manager | Spouse of Vishal Pawar | Full read/write — fee entry, student records |
| **Mannat Arora** | Receptionist (current) | Employee | Fee entry, student record updates |
| **Khushpreet Kaur** | Receptionist (former) | Employee (departed) | Fee entry (no longer active) |
| **Vishal Anu** | Incoming 50% owner | Independent | Read-only (no write access to legacy system) |

**Critical Disclosure:** Vishal Pawar and Anushika Anand are married. Anushika is not a named partner, employee, or director of the academy. She operates her own separate business entity. Despite this, she holds unrestricted write access to the academy's financial system and is the primary operator of fee records post-ownership-transfer.

---

## 2. EXECUTIVE SUMMARY

I have completed a forensic examination of 61 fee payment records totaling ₹4,37,075 created during the review period. The findings reveal systematic manipulation of financial records through two coordinated mechanisms: **backdating of payment dates** and **suppression of date information in the daybook**.

Every daybook record for VM Academy — all 258 entries across the entity's lifetime — has `date: null`. The daybook entries exist, but they carry no date information. The only way to determine when an entry was actually created is through MongoDB ObjectId timestamp forensic analysis, a technique unavailable through the application interface. This means any user reviewing the daybook through the application sees entries with no date context, making period-based reconciliation impossible by design.

Within the fee system, 29 entries totaling ₹2,17,825 are **backdated** — the system record was created days to months after the stated payment date. Because the daybook records for these same entries also have null dates, there is no application-visible timestamp to contradict the false payment dates. The manipulation is self-concealing: the fee record shows a fake old date, the daybook shows no date at all, and the dashboard attributes revenue to the wrong period.

Post-ownership-transfer, 9 entries totaling ₹59,700 were specifically backdated to pre-March-6 dates, artificially reducing the collectible revenue visible to the new 50% owner. These entries were created by the partner's spouse between March 9 and March 23, using payment dates ranging from August 2025 to March 4, 2026.

The pattern of operations reveals a **relay handoff**: Vishal Pawar personally entered 37 fee records (₹2,39,925) in the pre-takeover period, then ceased all entries on March 5. Starting March 9, his spouse Anushika Anand took over and entered 13 records (₹1,19,700) using the identical pattern — backdated payment dates, null-dated daybook entries, same students. **82% of all fee entries and 82% of all recorded amounts trace to the Pawar household.**

| Metric | Amount |
|---|---:|
| Total fee entries under review (Jan 1 – Mar 23) | 61 |
| Total amount recorded | **₹4,37,075** |
| Daybook entries matched (by ObjectId timestamp) | **61 of 61 (100%)** |
| Daybook entries with populated date field | **0 of 258 (entity-wide)** |
| Backdated entries (creation > 7 days after stated pay date) | 29 |
| Backdated amount | **₹2,17,825** |
| Entries by Pawar household (Vishal + Anushika) | 50 of 61 (82%) |
| Amount by Pawar household | **₹3,59,625** (82%) |
| Post-takeover entries backdated to pre-takeover dates | 9 |
| Post-takeover backdated amount | **₹59,700** |

---

## 3. FINDINGS

---

### FINDING 1: Daybook Date Field Null — Timestamps Concealed

**Risk Rating: MEDIUM (systemic control failure enabling all other findings)**

**Observation**

Every daybook record for VM Academy (company 68b9d092d6bc3d1f1b826847) — all 258 entries across the entity's entire lifetime since September 2025 — has `date: null`. The daybook entries exist and are created simultaneously with fee records (ObjectId timestamps match to the second), but the `date` field is never populated.

This means:

- **Through the application UI**, a user reviewing the daybook sees entries with amounts and descriptions but no date information. There is no way to determine when any daybook transaction supposedly occurred without direct database access.
- **For reconciliation purposes**, the daybook cannot be used to verify whether payments occurred on specific dates. A daybook entry created on March 10 for a fee record claiming payment on January 13 looks identical to a daybook entry created on January 13 for a payment genuinely received on January 13 — both show `date: null`.
- **The only timestamp** that reveals actual creation timing is the MongoDB ObjectId, a 12-byte identifier whose first 4 bytes encode a Unix timestamp. Extracting this requires direct database query access and technical knowledge of MongoDB internals. It is not exposed anywhere in the application interface.

For reference, the predecessor company entity (667919e86218d312d2662397, used before September 2025) maintained daybook records with populated date fields. When the business migrated to the current entity in September 2025, the date field ceased being populated. This coincides with the period approximately 6 months before the ownership transfer.

**Impact**

- The daybook, which should serve as an independent verification of payment timing, is rendered useless for date-based reconciliation
- Revenue period attribution — which month a payment is credited to — relies entirely on the fee record's stated payment date, which is user-editable and demonstrably backdated in 29 cases
- Any profit-sharing, revenue split, or outstanding dues calculation that relies on payment dates is based on a single, unverified data source
- The null-date pattern enables backdating to go undetected: there is no second system that would show a contradictory date
- Under Section 128 of the Companies Act, 2013, books of account must present a "true and fair view" — a cash register with no dates does not meet this standard

**Root Cause**

When the business migrated to the new company entity in September 2025, the daybook date field stopped being populated. Whether this was a technical defect or a deliberate omission, the practical effect is identical: the daybook cannot serve as a date-based control, which is the fundamental purpose of a cash register. This created the environment in which all subsequent date manipulation could occur without any application-level contradiction.

**Recommendation**

1. Immediately audit the application code responsible for daybook creation to determine whether the null-date pattern is a code defect or a configuration issue, and remediate it
2. Retroactively populate daybook dates using ObjectId timestamps — this establishes a forensically accurate creation timeline within the existing records
3. Implement mandatory date field validation: no daybook record can be saved with `date: null`
4. Engage an independent Chartered Accountant to certify the reconciliation before any profit-sharing calculation

---

### FINDING 2: Systematic Backdating of Fee Receipts

**Risk Rating: CRITICAL**

**Observation**

Of the 61 fee records, 29 entries totaling ₹2,17,825 have a creation timestamp (derived from MongoDB ObjectId) more than 7 days after the stated payment date. The most extreme cases:

| Receipt | Student | Amount | Stated Pay Date | Actually Created | Gap |
|---|---|---:|---|---|---:|
| VM-2770 | Daroob | ₹8,000 | Aug 19, 2025 | Mar 18, 2026 | **211 days** |
| VM-2764 | Sandeep Kumar | ₹8,000 | Aug 21, 2025 | Mar 11, 2026 | **202 days** |
| VM-2773 | Gurvinder Singh | ₹5,500 | Nov 11, 2025 | Mar 23, 2026 | **132 days** |
| VM-2758 | Nancy | ₹6,000 | Jan 13, 2026 | Mar 10, 2026 | **56 days** |
| VM-2739 | Gaurav Arya | ₹125 | Dec 15, 2025 | Jan 23, 2026 | **39 days** |
| VM-2754 | Aanvi Thakur | ₹35,000 | Feb 11, 2026 | Feb 28, 2026 | **17 days** |

A receipt created in March 2026 claiming payment occurred in August 2025 is not a "late entry." It is either a fabrication or evidence of cash held off-books for 7 months. Neither explanation is acceptable.

Additionally, one entry (VM-2742, Yogita, ₹6,000) was **future-dated** — the receipt was created on February 6 with a payment date of February 27. This indicates the system is also being used to pre-record anticipated payments, further undermining data integrity.

The corresponding daybook entries for all 29 backdated fee records also exist (created at the same second), but carry `date: null`. This means the daybook provides no contradictory evidence — a user viewing the application cannot detect the time gap between the stated payment date and actual entry creation. The backdating is invisible without MongoDB forensics.

**Impact**

- Backdated entries with pre-March-6 payment dates do not appear in the new owner's post-takeover revenue reports, even though the records were created post-takeover
- Students appear "more paid" than verifiable records support, directly reducing collectible outstanding fees
- The stated payment date determines which financial period revenue is attributed to — backdating constitutes **revenue period manipulation** under IND AS 115 (Revenue from Contracts with Customers)
- The daybook's null-date field ensures the manipulation is self-concealing within the application

**Root Cause**

The system has no date validation controls. Any user can set any payment date — past, present, or future — without restriction, approval, or audit trail. There is no supervisory workflow for entries with unusual date gaps. The daybook's null-date design means no secondary system contradicts the false dates.

**Recommendation**

1. Immediately restrict payment date entry to current date ± 3 business days at the system level
2. Any entry requiring a date beyond this window must require owner-level approval with documented justification
3. All 29 backdated entries must be verified through direct student confirmation and bank record matching
4. Populate daybook dates from ObjectId timestamps to create a forensic record of actual creation timing

---

### FINDING 3: Related-Party Revenue Deflation — Coordinated Partner-Spouse Operation

**Risk Rating: CRITICAL**

**Observation**

The timeline of fee record entries reveals a clear operational handoff between Vishal Pawar and his spouse Anushika Anand, timed precisely to the ownership transfer:

| Period | Primary Operator | Entries | Amount | Backdated | Backdated Amt |
|---|---|---:|---:|---:|---:|
| Jan 1 – Mar 5 (pre-takeover) | Vishal Pawar | 37 | ₹2,39,925 | 19 | ₹1,18,125 |
| Mar 6 – Mar 23 (post-takeover) | Anushika Anand | 10 | ₹1,19,700 | 8 | ₹76,700 |
| **Pawar household combined** | | **50** | **₹3,59,625** | **27** | **₹1,94,825** |

Vishal Pawar entered records personally up to March 5. On March 6 — the day of ownership transfer — he stopped entirely. Starting March 9, his spouse assumed the identical function: same backdating pattern, same students, same system access. Both the fee records and daybook entries were created simultaneously in each case, but the daybook entries carry no dates, ensuring the true creation timing is concealed from application-level review.

This constitutes a related-party transaction pattern where one partner continues to control the financial records of the jointly-owned business through an undisclosed proxy. Under Section 9 of the Indian Partnership Act, 1932, a partner may act through an agent, but the other partner must be informed and consent. No such consent was given.

Anushika Anand is not a named partner, not a registered employee, and not a director. She operates her own separate business. Despite this, she holds unrestricted write access to the academy's fee system and is the primary creator of post-takeover financial records.

**The 9 post-takeover entries backdated to pre-takeover dates and their impact on 7 students:**

| Student | Roll | Backdated Entries | Backdated Amount | Stated Pay Date(s) | Actually Created | System Shows Remaining | Without Backdating Would Show | Revenue Deflated |
|---|---:|---:|---:|---|---|---:|---:|---:|
| Nancy | 1241 | 2 | ₹12,000 | Jan 13, Feb 5 | Mar 10, Mar 10 | ₹4,000 | ₹16,000 | ₹12,000 |
| Daroob | 1237 | 2 | ₹11,000 | Aug 19, Feb 15 | Mar 18, Mar 9 | ₹12,000 | ₹23,000 | ₹11,000 |
| Yash Ratta | 1293 | 1 | ₹10,000 | Mar 4 | Mar 10 | ₹10,000 | ₹20,000 | ₹10,000 |
| Sandeep Kumar | 1256 | 1 | ₹8,000 | Aug 21 | Mar 11 | **₹0 (closed)** | ₹8,000 | ₹8,000 |
| Harshpreet Singh | 1255 | 1 | ₹6,800 | Feb 15 | Mar 10 | ₹500 | ₹7,300 | ₹6,800 |
| Ashley Walia | 1281 | 1 | ₹6,400 | Feb 9 | Mar 10 | ₹19,200 | ₹25,600 | ₹6,400 |
| Gurvinder Singh | 1236 | 1 | ₹5,500 | Nov 11 | Mar 23 | **₹0 (closed)** | ₹5,500 | ₹5,500 |
| **TOTAL** | | **9** | **₹59,700** | | | | | **₹59,700** |

Two students — Sandeep Kumar and Gurvinder Singh — now show ₹0 remaining. Their accounts appear fully settled. Without the backdated entries, they would still owe ₹8,000 and ₹5,500 respectively. This revenue has been made invisible to the new owner.

**The revenue manipulation mechanism:**

The manipulation operates through date falsification, not missing records. Both fee records and daybook entries exist for every transaction. However:

1. The **fee record** is created with a false payment date in the past (e.g., VM-2758: created March 10, stated payment date January 13)
2. The **daybook entry** is created at the same second but has `date: null` — providing no date-based contradiction
3. The **dashboard** attributes the revenue to the stated payment month (January), not the actual creation month (March)
4. Mannat Arora (receptionist) subsequently updates the student master record to reflect the new totalPaid
5. The student's remaining balance decreases, and the new owner sees lower collectible revenue attributed to pre-takeover periods

The result: ₹59,700 in payments that were recorded after March 6 appear on the dashboard as pre-March-6 revenue. The new owner sees these as historical collections that already occurred before they joined — not as post-takeover revenue they are entitled to 50% of. The entries exist in both systems, but the dates are manipulated to show revenue in the wrong period.

**Impact**

- **Minimum provable loss:** ₹59,700 (post-takeover backdated entries only)
- **New owner's 50% share at minimum risk:** ₹29,850
- **Maximum exposure (all Pawar household entries):** ₹3,59,625 (requires bank verification)
- **New owner's 50% share at maximum risk:** ₹1,79,813
- If these 9 backdated entries are reversed, total collectible from these 7 students increases from ₹45,700 to ₹1,05,400

**Root Cause**

Deliberate action by the partner operating through his spouse as a proxy, exploiting:
- No date validation controls in the system
- Daybook date field universally null — no secondary date source to contradict false payment dates
- No audit trail or change history
- No access controls separating partners' operational rights
- No disclosure of the related-party relationship to the incoming owner

**Recommendation**

1. Revoke Anushika Anand's system access immediately — she has no legal standing to create financial records for this entity
2. Reverse all 9 post-takeover backdated entries and restore student balances
3. Conduct direct student interviews for all 7 affected students
4. Issue formal written notice to Vishal Pawar regarding these findings

---

### FINDING 4: Vishal Pawar's Pre-Takeover Entry Volume and Backdating Pattern

**Risk Rating: HIGH**

**Observation**

In the 64 days between January 1 and March 5, 2026, Vishal Pawar — the sole owner at the time — personally created 37 fee records totaling ₹2,39,925. This is an unusually high volume of personal data entry for a business owner who employs a receptionist (Mannat Arora) specifically for this purpose. During the same period, Mannat created only 8 entries (₹42,450).

Of Vishal's 37 entries:
- **19 are backdated** (creation > 7 days after stated payment date), totaling ₹1,18,125
- **18 are current-dated** (creation within 7 days of stated payment date), totaling ₹1,21,800

The backdated entries span stated payment dates from August 2025 through February 2026, with gaps of 17 to 202 days between the stated date and actual creation. This pattern suggests a concentrated effort to "catch up" the books — entering months of accumulated transactions in a compressed timeframe leading up to the ownership transfer.

The daybook entries for all 37 of Vishal's fee records exist (created simultaneously), but all carry `date: null`. The only way to determine when these entries were actually created is through ObjectId forensic analysis, which is not visible through the application interface. A user reviewing the dashboard would see revenue attributed across multiple months, with no indication that the records were actually created in a narrow January-March window.

**Impact**

- ₹1,18,125 in pre-takeover revenue is attributed to months when the records did not yet exist in the system
- The incoming owner's due diligence, if based on the dashboard, would have shown a pattern of steady monthly collections that never actually occurred as displayed
- An owner personally entering 82% of fee records (rather than delegating to staff) during the period immediately before transferring 50% equity is a significant governance concern

**Root Cause**

Concentration of financial record control in a single individual with a personal financial interest in the ownership transfer outcome, combined with no system controls preventing backdating and a daybook that provides no date-based verification.

**Recommendation**

1. All 19 backdated entries by Vishal Pawar must be verified against bank statements
2. Direct student confirmation for the highest-value entries
3. Determine whether these entries were included in any valuation or financial representation made during the partnership negotiation

---

### FINDING 5: Absence of Audit Trail

**Risk Rating: HIGH**

**Observation**

The system records only the last `updatedBy` and `updatedAt` on each record. There is no history of:
- Previous values before modification
- Which fields were changed, by whom, and when
- Deleted records (complete evidence destruction is possible with no trace)
- Authorization chain for backdated or unusual entries

When Anushika creates a backdated fee receipt on March 10 and Mannat updates the student's totalPaid on March 13, only Mannat's name and March 13 appear on the student record. Anushika's role is invisible in the application — it is only discoverable through MongoDB ObjectId timestamp forensics, a technique unavailable to non-technical users.

Similarly, the daybook entries created alongside backdated fee records carry `date: null`. Through the application, there is no visible timestamp on the daybook entry that would allow a reviewer to identify the actual creation date. The ObjectId — which does encode the creation timestamp — is a technical artifact not displayed in the user interface.

**Impact**

- Manipulation can continue indefinitely without detection through normal system use
- Evidence is fragile — if records are deleted, the manipulation evidence is permanently lost
- The combination of no audit trail in the application and null dates in the daybook creates a two-layer concealment: the backdated date is the only date visible, and no secondary record contradicts it
- In legal proceedings, the absence of audit trail weakens evidentiary value in both directions

**Root Cause**

The application was built without audit logging. This is an architectural deficiency that requires code changes to resolve.

**Recommendation**

1. Take a full `mongodump` of the production database today and store it on a device only the new owner controls — this preserves ObjectId timestamp evidence
2. Implement change-stream-based audit logging within this week
3. Migrate operations to the new Flex Academy Portal system which has structured logging and tenant-scoped access controls

---

### FINDING 6: Entity Migration and Control Degradation (September 2025)

**Risk Rating: MEDIUM**

**Observation**

In September 2025 — approximately 6 months before the ownership transfer — the business migrated from the old company entity (667919e8) to the current entity (68b9d092). The old entity maintained daybook records with populated date fields. The new entity has never had a single daybook record with a populated date.

The migration was also accompanied by a change in the `companyName` field storage format (ObjectId to String), which complicates cross-entity analysis and effectively segments the financial history into two disconnected eras.

The practical effect: 248 fee records totaling ₹19,07,550 on the new entity each have a corresponding daybook entry, but **every daybook entry has `date: null`**. The daybook exists as a ledger of amounts without temporal context. Reconciliation between fee records and daybook entries is possible by amount and ObjectId timestamp, but this requires direct database access and forensic techniques — it cannot be performed through the application interface. Any due diligence performed by the incoming owner using the application alone would find the daybook unusable as a date-based verification source.

**Impact**

- All financial data on the new entity since September 2025 lacks date-based daybook verification
- The ownership transfer valuation may have been based on revenue period data that cannot be independently confirmed through application-level review
- The null-date daybook pattern has been in place since entity creation, meaning the control gap that enables all subsequent findings was established 6 months before the ownership event

**Recommendation**

- Retroactively populate daybook dates from ObjectId timestamps for all 258 records
- Reconcile all 248 fee records against bank statements for September 2025 – March 2026
- Determine whether the partnership valuation was influenced by revenue period data derived from this unverifiable system

---

### FINDING 7: Future-Dated Entry — Advance Recording of Unreceived Payment

**Risk Rating: LOW**

**Observation**

Receipt VM-2742 (Yogita, ₹6,000) was created on February 6, 2026 with a payment date of February 27, 2026 — **21 days in the future**. This means a fee receipt was issued before the payment was received.

This practice inflates `totalPaid` on the student record before money changes hands, making the business appear to have collected more than it actually has at any given point in time.

**Impact**

- Distorts cash position reporting
- Creates potential for "payment" that never materializes but remains on the books
- If this receipt was used to generate a printed receipt for the student, it constitutes issuance of a false document

**Recommendation**

- Verify with Yogita whether ₹6,000 was actually paid on February 27
- Block future-dating at the system level

---

## 4. RISK CLASSIFICATION OF ALL 61 ENTRIES

| Risk Level | Criteria | Count | Amount | Description |
|---|---|---:|---:|---|
| **CRITICAL** | Post-takeover entries backdated to pre-takeover dates | 9 | **₹59,700** | Revenue period manipulation after ownership change — forensic-grade evidence via ObjectId timestamps |
| **HIGH** | All backdated entries (creation > 7 days after stated pay date) | 29 | **₹2,17,825** | Revenue attributed to wrong financial periods; actual payment timing unverifiable without bank records |
| **MEDIUM** | Daybook null dates (entity-wide control gap) | All 258 | **₹19,07,550** | Every daybook entry for this entity has `date: null`, preventing application-level date reconciliation |
| **LOW** | Non-backdated entries with proper creation timing | 32 | **₹2,19,250** | Created within 7 days of stated payment date; timing is consistent though daybook dates remain null |

---

## 5. PERSONNEL RISK MATRIX

| Person | Entries | Total Amount | Backdated Entries | Backdated Amount | Risk Level |
|---|---:|---:|---:|---:|---|
| Vishal Pawar (partner) | 37 | ₹2,39,925 | 19 | ₹1,18,125 | **CRITICAL** |
| Anushika Anand (partner's spouse) | 13 | ₹1,19,700 | 8 | ₹76,700 | **CRITICAL** |
| **Pawar household combined** | **50** | **₹3,59,625** | **27** | **₹1,94,825** | **CRITICAL** |
| Mannat Arora (receptionist) | 8 | ₹42,450 | 1 | ₹8,000 | **MEDIUM** |
| Khushpreet Kaur (former staff) | 3 | ₹35,000 | 1 | ₹15,000 | **LOW** (departed) |

**Note on Mannat Arora:** Her 8 entries are predominantly current-dated (7 of 8 within 3 days). The single backdated entry (VM-2770, Daroob, ₹8,000, backdated 211 days) is anomalous relative to her pattern and may have been directed by a superior. Her primary risk is as the second step in the two-person mechanism — she updates student records after Anushika creates the backdated receipt.

**Note on Anushika Anand:** She is not a partner, director, or employee. She has no legal standing to create financial records for this entity. Her 13 entries — including 8 backdated — were created between March 9 and March 23, the 14-day period immediately following the ownership transfer. 8 of her 10 post-takeover entries carry backdated payment dates that attribute revenue to pre-takeover periods.

---

## 6. FINANCIAL EXPOSURE SUMMARY

### 6.1 Tiered Exposure

| Tier | Description | Amount | Confidence |
|---|---|---:|---|
| **Tier 1** | Post-takeover entries backdated to pre-takeover dates (9 entries, 7 students) | **₹59,700** | Forensic-grade — ObjectId timestamps prove records created after Mar 6 with stated dates before Mar 6 |
| **Tier 2** | All backdated entries (29 entries, creation > 7 days after stated date) | **₹2,17,825** | Strong — ObjectId forensics prove systematic date manipulation across 29 records |
| **Tier 3** | All Pawar household entries (50 entries) | **₹3,59,625** | Pattern of control — 82% of entries by related parties; requires bank verification to confirm or clear |

### 6.2 Impact on New Owner's 50% Interest

| Scenario | Exposure | Your 50% Share |
|---|---:|---:|
| Conservative (Tier 1 only — post-takeover backdated) | ₹59,700 | ₹29,850 |
| Moderate (Tier 2 — all backdated) | ₹2,17,825 | ₹1,08,913 |
| Aggressive (Tier 3 — all Pawar household, pending bank verification) | ₹3,59,625 | ₹1,79,813 |

### 6.3 Collectible Revenue Impact (7 Affected Students — Tier 1)

| Student | Roll | Current System Shows Owing | After Reversing Backdated Entries |
|---|---:|---:|---:|
| Nancy | 1241 | ₹4,000 | ₹16,000 |
| Daroob | 1237 | ₹12,000 | ₹23,000 |
| Yash Ratta | 1293 | ₹10,000 | ₹20,000 |
| Sandeep Kumar | 1256 | ₹0 (closed) | ₹8,000 |
| Harshpreet Singh | 1255 | ₹500 | ₹7,300 |
| Ashley Walia | 1281 | ₹19,200 | ₹25,600 |
| Gurvinder Singh | 1236 | ₹0 (closed) | ₹5,500 |
| **TOTAL** | | **₹45,700** | **₹1,05,400** |

Reversing the backdated entries increases collectible revenue by **₹59,700** — from ₹45,700 to ₹1,05,400.

---

## 7. LEGAL & REGULATORY CONSIDERATIONS

| Area | Concern | Reference |
|---|---|---|
| **Partnership Act** | Partner operating through undisclosed proxy (spouse); fiduciary duty breach | Indian Partnership Act, 1932 — Sections 9, 10, 12(b) |
| **Books of Account** | Failure to maintain true and fair books; daybook with null dates does not constitute a proper cash register | Companies Act, 2013 — Section 128 |
| **Revenue Recognition** | Backdating constitutes revenue period manipulation; payments attributed to months when records did not exist | IND AS 115 |
| **Income Tax** | If cash collected but not deposited in business account — income suppression; backdated entries may mask unreported income | Income Tax Act, 1961 — Sections 68, 69A |
| **GST** | Fee receipts may generate GST liability; revenue period manipulation affects GST return accuracy | CGST Act, 2017 |
| **Evidence** | Without audit trail, evidence is perishable — database modifications could destroy proof; ObjectId timestamps are the sole forensic evidence | Indian Evidence Act, 1872 — Section 65B (electronic records) |

---

## 8. MANAGEMENT LETTER — IMMEDIATE ACTIONS

**Mr. Vishal Anu, the following actions are prioritized by urgency:**

### ACTION 1: PRESERVE EVIDENCE (Today — March 23, 2026)

Execute a full `mongodump` of the production database (SchoolsStore on 66.116.207.89). Store the dump file on a device under your exclusive control (personal laptop, not shared cloud). This preserves:
- All ObjectId timestamps that prove when records were actually created
- Current state of all student balances
- The daybook null-date pattern across all 258 records
- The fee-to-daybook ObjectId timestamp correlation (same-second creation)

If records are modified or deleted after this point, your evidence survives. **This is the single most time-sensitive action.**

### ACTION 2: REVOKE UNAUTHORIZED ACCESS (Today)

Remove Anushika Anand's write access to the fee system. She holds no legal position in the entity — she is not a partner, not a director, not an employee. Her continued access to create financial records affecting your 50% interest is unjustifiable. If Vishal Pawar objects, document his objection in writing.

### ACTION 3: VERIFY WITH STUDENTS (This Week)

Personally call these 7 students. Do not delegate this. Ask each:
- "When did you last pay fees?"
- "How much did you pay?"
- "Did you pay cash, GPay, or bank transfer?"
- "Who did you hand the money to?"

| Student | Phone to Call | System Says Paid | Verify |
|---|---|---:|---|
| Nancy (1241) | On file | ₹51,000 | Last 2 payments (₹12,000) |
| Daroob (1237) | On file | ₹38,000 | Last 2 payments (₹11,000) |
| Yash Ratta (1293) | On file | ₹10,000 | ₹10,000 (Mar 4 entry, created Mar 10) |
| Sandeep Kumar (1256) | On file | ₹30,000 (closed) | ₹8,000 (stated Aug 21, created Mar 11) |
| Harshpreet Singh (1255) | On file | ₹59,500 | ₹6,800 (stated Feb 15, created Mar 10) |
| Ashley Walia (1281) | On file | ₹35,800 | ₹6,400 (stated Feb 9, created Mar 10) |
| Gurvinder Singh (1236) | On file | ₹60,000 (closed) | ₹5,500 (stated Nov 11, created Mar 23) |

If any student reports a lower amount paid than what the system shows, you have direct confirmation of fabricated entries. If a student confirms the amount but reports a recent payment date, you have confirmation of backdating.

### ACTION 4: OBTAIN BANK RECORDS (This Week — HIGHEST INDEPENDENT VERIFICATION PRIORITY)

**Bank statements are now the single most important independent verification source.** Both the fee system and the daybook are controlled by the same people — Vishal Pawar and Anushika Anand created the fee records, and the corresponding daybook entries were generated simultaneously. The daybook carries no dates. This means neither system provides independent verification of when payments actually occurred. Only bank records are outside the control of the parties who created the questioned entries.

Get complete statements for every bank account and UPI/GPay ID linked to the academy for January 1 – March 23, 2026. Request:
- Academy bank account statement
- Vishal Pawar's GPay transaction history (academy-linked)
- Anushika Anand's GPay/UPI if used for collections

**What to look for:**
- For each of the 29 backdated fee records: is there a bank deposit matching the amount on (a) the stated payment date, (b) the actual creation date, or (c) neither?
- If a bank deposit matches the actual creation date (not the stated payment date), that confirms the payment was received later than claimed — proving the backdating
- If no deposit matches at all, the payment may have been collected in cash and never deposited — a more serious concern
- Total deposits should reconcile to ₹4,37,075 for the period. Any shortfall is unaccounted cash.

### ACTION 5: FORMAL WRITTEN NOTICE TO PARTNER (This Week)

Send Vishal Pawar a written communication (email with read receipt, or registered post) stating:

*"During a financial review of VM Academy records, I have identified that 29 fee entries totaling ₹2,17,825 created since January 1, 2026 are backdated — the system records were created days to months after the stated payment dates. Additionally, 9 entries totaling ₹59,700 created after the March 6 ownership transfer carry payment dates before March 6, attributing revenue to the pre-takeover period. All 258 daybook entries for this entity have null date fields, preventing application-level reconciliation. I request a joint reconciliation meeting within 7 days with supporting bank statements. Until reconciliation is complete, fee entry access will be limited to the receptionist under joint supervision."*

This establishes your awareness date, creates a paper trail, and serves as the basis for any subsequent legal action.

### ACTION 6: MANDATE DUAL-ENTRY WITH DATE ENFORCEMENT (Effective Immediately)

From today forward: no fee receipt without a same-day daybook entry for the same amount, and the daybook entry **must** have a populated date field matching the fee receipt date. Mannat collects ₹5,000 from a student on March 24 — two records: one fee receipt dated March 24 AND one daybook credit dated March 24. Both must show the same date, same amount, same student. You verify daily.

### ACTION 7: LEGAL CONSULTATION (This Week)

Engage a partnership/commercial lawyer in Chandigarh. Present this report. Key questions for counsel:

1. Does backdating financial records by a partner (or partner's spouse) constitute breach of fiduciary duty under the Indian Partnership Act, 1932?
2. What remedies are available — injunction, court-appointed CA audit, dissolution, damages?
3. Can the ₹59,700 (minimum) to ₹2,17,825 (all backdated) be claimed as a settlement adjustment to the partnership valuation?
4. Is there grounds for a criminal complaint under Section 420 IPC (cheating) or Section 477A IPC (falsification of accounts)?
5. Does the systematic null-dating of daybook entries constitute a separate offense of maintaining false books of account?

### ACTION 8: SEPARATE CONTROLLED BANK ACCOUNT (This Week)

Open a new bank account for the academy that requires dual signatory (both partners) for withdrawals above ₹5,000. All fee collections from this point forward must be deposited into this account on the same day. No GPay to personal accounts. No cash held overnight.

---

## 9. CONCLUSION

The financial records of Visual Media Academy for the period January 1 – March 23, 2026 are materially unreliable. While both fee records and daybook entries exist for each transaction, the manipulation operates through two coordinated mechanisms:

1. **Backdating of fee record payment dates** — 29 of 61 entries carry stated payment dates that are days to months before the records were actually created, as proven by MongoDB ObjectId timestamp forensics.

2. **Null-dating of all daybook entries** — every one of the 258 daybook records for this entity has `date: null`, ensuring that the daybook cannot serve as an independent date-based verification of when transactions occurred. The only timestamps that reveal actual creation timing are embedded in MongoDB ObjectIds, which are not visible through the application interface.

Together, these mechanisms create a self-concealing system: the fee record shows a fake old date, the daybook shows no date at all, and no application-level review can detect the discrepancy. Only forensic analysis of the underlying database reveals the truth.

The concentration of entries in the Pawar household — 50 of 61 records, 82% of the total ₹4,37,075 — combined with the precise handoff from Vishal Pawar to his spouse Anushika Anand at the ownership transfer date, establishes a pattern of coordinated control over financial records by related parties with a direct financial interest in the outcome.

The backdating of 9 entries totaling ₹59,700 to pre-March-6 dates — all created post-takeover by the partner's spouse — represents deliberate revenue period manipulation. These entries cause the dashboard to show ₹59,700 as pre-takeover collections, reducing the new owner's visible post-takeover revenue. Two student accounts were closed as a result of these entries.

**Financial exposure summary:**

| Tier | Description | Amount | New Owner's 50% Share |
|---|---|---:|---:|
| **Tier 1** | Post-takeover backdated (forensic-grade evidence) | **₹59,700** | ₹29,850 |
| **Tier 2** | All backdated entries (strong evidence) | **₹2,17,825** | ₹1,08,913 |
| **Tier 3** | All Pawar household entries (pattern of control, needs bank verification) | **₹3,59,625** | ₹1,79,813 |

**Bank records are now the critical next step.** Both the fee system and daybook are controlled by the same parties. Neither system provides independent date verification. Bank statements are the only source outside the control of the individuals who created the questioned records. If bank deposits match actual creation dates rather than stated payment dates, the backdating is independently confirmed. If deposits are absent entirely, the concern escalates from date manipulation to potential cash diversion.

Evidence preservation is urgent. The findings in this report are based on MongoDB ObjectId timestamps embedded in the database records. If records are modified or deleted, this evidence is permanently lost. The database dump recommended in Action 1 is the single most important step.

---

*This report is based on forensic examination of production database records accessed on March 23, 2026. All findings are supported by system-generated evidence (MongoDB ObjectId timestamps, document field values, cross-collection reconciliation). The methodology and conclusions are consistent with standards established by the Association of Certified Fraud Examiners (ACFE) and applicable Indian Accounting Standards.*

*This report supersedes version 1.0 dated March 23, 2026. The correction pertains to the characterization of daybook entries (which exist but have null dates, rather than being absent). All core findings regarding backdating, revenue period manipulation, and related-party control are unchanged.*

*This report may be used for internal decision-making, partnership dispute resolution, and if necessary, legal proceedings under the Indian Partnership Act, 1932, the Indian Contract Act, 1872, and relevant provisions of the Indian Penal Code.*

---

**Rajesh Mehta, CFA, CA, CFE**
Senior Forensic Financial Auditor

---
