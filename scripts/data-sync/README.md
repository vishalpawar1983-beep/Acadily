# Data Sync Scripts — 2026-04-26 Reconciliation

Idempotent additive-only data reconciliation between **VPS prod** (read-only)
and **dev Atlas** (`flex_academy_dev`, also used by `app.acadily.com` prod
during the Phase-3 coexistence window).

## Context

After the initial migration, prod (VPS / Visual Media Academy / `ims_reliance`
tenant) continued accepting payments and updating student-level financial
fields. The dev DB held a snapshot from migration day, so reports showed
incorrect counts and totals (e.g. `monthly-reports` showed `Total Collection
0.00` instead of `96890.00`).

These scripts bring dev to full parity with prod **without writing to prod**.
Each script is idempotent (`APPLY=true` to commit; dry-run by default) and
archives any dev-only docs before deletion so nothing is lost.

## Run order

| # | Script | What it does |
|---|---|---|
| 01 | `01-backfill-missing-3-payments.cjs` | Add prod receipts VM-2771/2/3 (March 23) that the prior bulk sync silently dropped (unique-index collision with dev test data). Used during initial RCA — superseded by `02`. |
| 02 | `02-resolve-receipt-collision.cjs` | **Option A**: archive 3 colliding dev test receipts to `feepayments_dev_test_archive`, insert prod's 3 originals, bump `receiptcounters` to `2793` to prevent future collisions. |
| 03 | `03-sync-student-financials-v1.cjs` | Sync 14 students' `enrollment.{remainingFees, totalPaid, netFees}` from prod's `{remainingCourseFees, totalPaid, netCourseFees}`. Superseded by `05`. |
| 04 | `04-backfill-feepayment-top-level-fields.cjs` | Backfill 37 migrated `feepayments` whose mapper stored prod fields only inside `_raw`. Copies `amountPaid`, `amountDate`, `narration`, `lateFees`, `studentInfo`, `companyName`, etc. to top level so legacy endpoints (`/api/courseFees/allCourseFess`) read them. Fixes `monthly-reports` screen returning 0. |
| 05 | `05-sync-student-financials-v2.cjs` | Comprehensive v2: 8 fields (adds `installmentAmount`, `installmentCount`, `downPayment`, `discount`, `courseFees`). Fixes installment-amount mismatches on `monthlyCollectionFees` (e.g. Gaurav Arya 6375 → 7333, Yash Ratta 3333 → 5000). |
| 06 | `06-archive-orphan-docs.cjs` | Archive + delete dev docs whose `_legacyId` no longer exists on prod (prod has since deleted them). 1 `feepayment` (VM-2529 ₹20k) + 14 `feeinstallments`. Restores doc-count parity. |

## Inputs

Scripts read fresh prod dumps from `/tmp/prod_*_fresh.json`. Refresh with:

```bash
# from local machine
SSHPASS='<vps-pwd>' sshpass -e ssh -o HostKeyAlgorithms=+ssh-rsa root@66.116.207.89 \
  'for c in students courses companies coursefees paymentinstallmenttimes daybookaccounts daybookdatas; do
     mongoexport --quiet --uri="mongodb://imsapp:ims12345@127.0.0.1:27017/SchoolsStore?authSource=SchoolsStore" \
       --collection=$c --jsonArray > /tmp/prod_${c}_fresh.json 2>/dev/null
   done'
SSHPASS='<vps-pwd>' sshpass -e scp -o HostKeyAlgorithms=+ssh-rsa "root@66.116.207.89:/tmp/prod_*_fresh.json" /tmp/
```

## Final state (post-run, 2026-04-26)

- `feepayments`: dev 407 / prod 407 ✓ (was 408 before orphan cleanup)
- `feeinstallments`: dev 228 / prod 228 ✓
- `monthly-reports/68b9d092…` Total Collection: ₹96,890 ✓
- `monthlyCollectionFees/68b9d092…` not-paid count: 5 ✓
- All installment amounts match prod exactly.

## Archive collections

- `feepayments_dev_test_archive` — 3 dev test receipts (jatin/roll 1006, ₹6,000)
- `feepayments_orphan_archive` — 1 orphan (VM-2529, ₹20k Daroob, prod-deleted)
- `feeinstallments_orphan_archive` — 14 orphans (Jan–Mar 2026, prod-deleted)
