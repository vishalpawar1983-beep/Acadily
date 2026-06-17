/**
 * Student Commission — Edit / Delete actions addon.
 *
 * The "Student Commission" table on a student profile (rendered by the compiled
 * bundle) lists commissions but offers no way to edit or remove them. The bundle
 * was patched to stamp each row's <tr> with data-* attributes (data-cid + field
 * values); this addon reads those, appends an "Actions" column, and wires up:
 *
 *   • Edit   → modal prefilled from the row, PUT /api/students/commission/:id
 *   • Delete → confirm, DELETE /api/students/commission/:id
 *
 * Both reload the page on success so the table AND the Daybook (which now counts
 * commission payouts as an expense) reflect the change. companyId is left
 * untouched on edit so the commission keeps counting toward its company's total.
 */
(function () {
  'use strict';

  var API = '/api/students/commission';
  var MODAL_ID = 'cact-modal';

  function getAuthHeader() {
    try {
      var keys = Object.keys(localStorage);
      for (var i = 0; i < keys.length; i++) {
        var val = localStorage.getItem(keys[i]);
        if (val && val.indexOf('api_token') !== -1) {
          try {
            var parsed = JSON.parse(val);
            var token = parsed.api_token || parsed.token || parsed.accessToken;
            if (token) return 'Bearer ' + token;
          } catch (e) { /* skip */ }
        }
      }
    } catch (e) { /* ignore */ }
    return '';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function showToast(msg, isError) {
    var id = 'cact-toast';
    var ex = document.getElementById(id);
    if (ex) ex.remove();
    var t = document.createElement('div');
    t.id = id;
    t.textContent = msg;
    t.style.cssText = [
      'position:fixed', 'bottom:24px', 'right:24px', 'z-index:100001',
      'padding:12px 20px', 'border-radius:8px', 'font-size:14px', 'font-weight:600',
      'color:#fff', 'box-shadow:0 4px 16px rgba(0,0,0,.3)', 'transition:opacity .4s',
      isError ? 'background:#dc3545' : 'background:#198754',
    ].join(';');
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 500); }, 3000);
  }

  function api(method, url, body) {
    return fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', Authorization: getAuthHeader() },
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) {
      return r.json().then(function (b) {
        if (!r.ok) {
          throw new Error((b && (b.message || (b.error && b.error.message))) || ('HTTP ' + r.status));
        }
        return b;
      });
    });
  }

  // ISO timestamp -> YYYY-MM-DD in local time (for <input type=date>)
  function isoToYmd(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  // ── Inject the Actions column into the commission table ──────────────────────
  function inject() {
    var rows = document.querySelectorAll('tr[data-cid]');
    if (!rows.length) return;

    var tables = new Set();
    rows.forEach(function (tr) {
      var table = tr.closest('table');
      if (table) tables.add(table);
    });

    tables.forEach(function (table) {
      // Header
      var headRow = table.querySelector('thead tr');
      if (headRow && !headRow.querySelector('th[data-cact-h]')) {
        var th = document.createElement('th');
        th.setAttribute('data-cact-h', '1');
        th.className = 'min-w-100px text-end';
        th.textContent = 'Actions';
        headRow.appendChild(th);
      }
    });

    rows.forEach(function (tr) {
      if (tr.querySelector('td[data-cact-c]')) return; // already injected
      var td = document.createElement('td');
      td.setAttribute('data-cact-c', '1');
      td.className = 'text-end';
      td.innerHTML =
        '<button type="button" class="btn btn-sm btn-light-primary me-2 cact-edit">' +
          '<i class="fa fa-pen"></i></button>' +
        '<button type="button" class="btn btn-sm btn-light-danger cact-del">' +
          '<i class="fa fa-trash"></i></button>';
      td.querySelector('.cact-edit').addEventListener('click', function () { openEdit(tr); });
      td.querySelector('.cact-del').addEventListener('click', function () { doDelete(tr); });
      tr.appendChild(td);
    });
  }

  function rowData(tr) {
    var d = tr.dataset;
    return {
      id: d.cid,
      studentName: d.sname || '',
      commissionPersonName: d.person || '',
      commissionAmount: d.amount || '',
      commissionPaid: d.paid || '',
      voucherNumber: d.voucher || '',
      commissionDate: d.date || '',
      narration: d.narration || '',
    };
  }

  function doDelete(tr) {
    var r = rowData(tr);
    var who = (r.studentName.split('-')[0] || 'this student').trim();
    if (!confirm('Delete the commission for ' + who + ' (' + r.commissionPersonName + ')?')) return;
    api('DELETE', API + '/' + encodeURIComponent(r.id))
      .then(function () { showToast('Commission deleted', false); setTimeout(function () { location.reload(); }, 600); })
      .catch(function (e) { showToast(e.message, true); });
  }

  // ── Edit modal ───────────────────────────────────────────────────────────────
  function ensureModal() {
    var m = document.getElementById(MODAL_ID);
    if (m) return m;
    var overlay = document.createElement('div');
    overlay.id = MODAL_ID;
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:100000', 'display:none',
      'align-items:flex-start', 'justify-content:center',
      'background:rgba(0,0,0,.5)', 'overflow:auto', 'padding:40px 16px',
    ].join(';');
    overlay.innerHTML =
      '<div class="card" style="width:100%;max-width:640px;box-shadow:0 10px 40px rgba(0,0,0,.3);">' +
        '<div class="card-header d-flex align-items-center justify-content-between">' +
          '<h3 class="fw-bold m-0">Edit Student Commission</h3>' +
          '<button type="button" id="cact-close" class="btn btn-sm btn-icon btn-light">&times;</button>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="row g-4">' +
            '<div class="col-12"><label class="form-label fw-semibold">Student</label>' +
              '<input id="cact-student" class="form-control form-control-solid" disabled /></div>' +
            '<div class="col-md-6"><label class="form-label fw-semibold">Commission Person Name</label>' +
              '<input id="cact-person" class="form-control form-control-solid" maxlength="200" /></div>' +
            '<div class="col-md-6"><label class="form-label fw-semibold">Voucher Number</label>' +
              '<input id="cact-voucher" class="form-control form-control-solid" maxlength="100" /></div>' +
            '<div class="col-md-6"><label class="form-label fw-semibold">Commission Amount</label>' +
              '<input id="cact-amount" type="number" min="0" step="any" class="form-control form-control-solid" /></div>' +
            '<div class="col-md-6"><label class="form-label fw-semibold">Commission Paid</label>' +
              '<input id="cact-paid" type="number" min="0" step="any" class="form-control form-control-solid" /></div>' +
            '<div class="col-md-6"><label class="form-label fw-semibold">Commission Date</label>' +
              '<input id="cact-date" type="date" class="form-control form-control-solid" /></div>' +
            '<div class="col-md-6 d-flex align-items-end"><div class="text-muted fs-7">' +
              'Remaining = Amount &minus; Paid (recalculated automatically).<br>' +
              'Paid is what shows in the Daybook as an expense.</div></div>' +
            '<div class="col-12"><label class="form-label fw-semibold">Narration</label>' +
              '<input id="cact-narration" class="form-control form-control-solid" maxlength="500" /></div>' +
          '</div>' +
        '</div>' +
        '<div class="card-footer d-flex justify-content-end gap-3">' +
          '<button type="button" id="cact-cancel" class="btn btn-light">Cancel</button>' +
          '<button type="button" id="cact-save" class="btn btn-primary">Save Changes</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.querySelector('#cact-close').addEventListener('click', close);
    overlay.querySelector('#cact-cancel').addEventListener('click', close);
    return overlay;
  }
  function close() { var m = document.getElementById(MODAL_ID); if (m) m.style.display = 'none'; }

  function openEdit(tr) {
    var r = rowData(tr);
    var m = ensureModal();
    m.style.display = 'flex';
    m.querySelector('#cact-student').value = r.studentName;
    m.querySelector('#cact-person').value = r.commissionPersonName;
    m.querySelector('#cact-voucher').value = r.voucherNumber;
    m.querySelector('#cact-amount').value = r.commissionAmount;
    m.querySelector('#cact-paid').value = r.commissionPaid;
    m.querySelector('#cact-date').value = isoToYmd(r.commissionDate);
    m.querySelector('#cact-narration').value = r.narration;

    var save = m.querySelector('#cact-save');
    save.onclick = function () {
      var person = m.querySelector('#cact-person').value.trim();
      var amount = Number(m.querySelector('#cact-amount').value);
      var paid = Number(m.querySelector('#cact-paid').value);
      var dateVal = m.querySelector('#cact-date').value;
      if (!person) { showToast('Commission person name is required', true); return; }
      if (!(amount >= 0) || !(paid >= 0)) { showToast('Amount and Paid must be valid numbers', true); return; }
      if (paid > amount) { showToast('Paid cannot exceed the commission amount', true); return; }
      // Preserve the original timestamp if the day was not changed (avoids TZ drift)
      var commissionDate = (dateVal && dateVal === isoToYmd(r.commissionDate)) ? r.commissionDate : dateVal;

      var payload = {
        commissionPersonName: person,
        voucherNumber: m.querySelector('#cact-voucher').value.trim(),
        commissionAmount: amount,
        commissionPaid: paid,
        commissionDate: commissionDate,
        narration: m.querySelector('#cact-narration').value,
      };
      save.disabled = true;
      var orig = save.textContent; save.textContent = 'Saving…';
      api('PUT', API + '/' + encodeURIComponent(r.id), payload)
        .then(function () { showToast('Commission updated', false); close(); setTimeout(function () { location.reload(); }, 600); })
        .catch(function (e) { showToast(e.message, true); save.disabled = false; save.textContent = orig; });
    };
  }

  // ── Boot ─────────────────────────────────────────────────────────────────────
  var observer = new MutationObserver(function () { inject(); });
  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    inject();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
