/**
 * Delete safeguards.
 *
 *  1) Confirmation — on pages whose delete is now a soft-delete (enquiries, DayBook
 *     accounts, students), intercept trash-button clicks in CAPTURE phase (before
 *     React) and ask for confirmation. Cancelling blocks the delete entirely.
 *
 *  2) Recently Deleted (enquiries) — a button on the "View All Enquiry" page opens a
 *     panel listing soft-deleted enquiries for the company, each with a Restore button
 *     (POST /api/submit-form/:id/restore). Lists via GET /api/submit-form-deleted.
 */
(function () {
  'use strict';

  var MODAL_ID = 'rd-modal';
  var BTN_ID = 'rd-open-btn';

  function getToken() {
    try {
      var keys = Object.keys(localStorage);
      for (var i = 0; i < keys.length; i++) {
        var v = localStorage.getItem(keys[i]);
        if (v && v.indexOf('api_token') !== -1) {
          try { var p = JSON.parse(v); var t = p.api_token || p.token || p.accessToken; if (t) return t; } catch (e) { /* skip */ }
        }
      }
    } catch (e) { /* ignore */ }
    return '';
  }
  function auth() { return { Authorization: 'Bearer ' + getToken() }; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ── 1. Delete confirmation ───────────────────────────────────────────────────────
  function onSoftDeletePage() {
    var p = location.pathname;
    return /\/view-form-data\//i.test(p) ||         // enquiries
      /\/daybook\/viewAccount\//i.test(p) ||         // DayBook accounts
      /\/students[\/-]/i.test(p) ||                  // All / Pending / Clear students
      /\/drop-out-students\//i.test(p);              // Drop-out students
  }

  document.addEventListener(
    'click',
    function (e) {
      if (!onSoftDeletePage()) return;
      var btn = e.target.closest && e.target.closest('a, button');
      if (!btn) return;
      if (btn.id === BTN_ID || (btn.closest && btn.closest('#' + MODAL_ID))) return;
      var iconCls = (btn.querySelector && btn.querySelector('i') ? btn.querySelector('i').className : '') || '';
      var isTrash = /ki-trash|trash/i.test(iconCls) || /\btrash\b/i.test(btn.className || '');
      if (!isTrash) return;
      var inRow = !!(btn.closest && btn.closest('tbody tr'));
      var msg = (inRow ? 'Delete this item?' : 'Delete the selected items?') +
        '\n\nIt will be removed from the list but kept on the server and can be recovered if needed.';
      if (!window.confirm(msg)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true, // capture — runs before React's delegated handler
  );

  // ── 2. Recently Deleted (enquiries) ──────────────────────────────────────────────
  function currentCompanyId() {
    var m = location.pathname.match(/\/view-form-data\/([a-f0-9]{24})/i);
    return m ? m[1] : null;
  }

  function toast(msg, isErr) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = ['position:fixed', 'bottom:24px', 'right:24px', 'z-index:100002', 'padding:12px 20px',
      'border-radius:8px', 'font-weight:600', 'color:#fff', 'box-shadow:0 4px 16px rgba(0,0,0,.3)',
      isErr ? 'background:#dc3545' : 'background:#198754'].join(';');
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }

  function ensureModal() {
    if (document.getElementById(MODAL_ID)) return document.getElementById(MODAL_ID);
    var ov = document.createElement('div');
    ov.id = MODAL_ID;
    ov.style.cssText = ['position:fixed', 'inset:0', 'z-index:100001', 'display:none',
      'align-items:flex-start', 'justify-content:center', 'background:rgba(0,0,0,.5)', 'overflow:auto', 'padding:40px 16px'].join(';');
    ov.innerHTML =
      '<div class="card" style="width:100%;max-width:820px;box-shadow:0 10px 40px rgba(0,0,0,.3);">' +
        '<div class="card-header d-flex align-items-center justify-content-between">' +
          '<h3 class="fw-bold m-0">Recently Deleted Enquiries</h3>' +
          '<button type="button" id="rd-close" class="btn btn-sm btn-icon btn-light">&times;</button>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="text-muted mb-4">Deleted enquiries are kept here and can be restored.</div>' +
          '<div class="table-responsive"><table class="table table-row-bordered align-middle gy-3">' +
            '<thead><tr class="fw-bold fs-7 text-gray-600 text-uppercase">' +
              '<th>Name</th><th>Mobile</th><th>Deleted</th><th class="text-end">Action</th>' +
            '</tr></thead><tbody id="rd-tbody"><tr><td colspan="4" class="text-muted">Loading…</td></tr></tbody>' +
          '</table></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.style.display = 'none'; });
    ov.querySelector('#rd-close').addEventListener('click', function () { ov.style.display = 'none'; });
    return ov;
  }

  function fieldVal(row, name) {
    var f = (row.formFiledValue || []).find(function (x) { return x.name === name; });
    return f ? f.value : '';
  }

  function loadDeleted() {
    var tbody = document.getElementById('rd-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="text-muted">Loading…</td></tr>';
    var company = currentCompanyId();
    fetch('/api/submit-form-deleted', { headers: auth() })
      .then(function (r) { return r.json(); })
      .then(function (b) {
        var rows = (b && b.formFieldValues || []).filter(function (r) {
          return !company || String(r.companyId) === company;
        });
        if (!rows.length) { tbody.innerHTML = '<tr><td colspan="4" class="text-muted">No deleted enquiries.</td></tr>'; return; }
        tbody.innerHTML = rows.map(function (r) {
          var when = r.deletedAt ? new Date(r.deletedAt).toLocaleString() : '';
          return '<tr>' +
            '<td class="fw-bold">' + esc(fieldVal(r, 'Name') || '(no name)') + '</td>' +
            '<td>' + esc(fieldVal(r, 'Mobile Number')) + '</td>' +
            '<td class="text-muted">' + esc(when) + '</td>' +
            '<td class="text-end"><button type="button" class="btn btn-sm btn-light-primary rd-restore" data-id="' + esc(r._id) + '">Restore</button></td>' +
          '</tr>';
        }).join('');
        tbody.querySelectorAll('.rd-restore').forEach(function (btn) {
          btn.addEventListener('click', function () {
            btn.disabled = true; btn.textContent = 'Restoring…';
            fetch('/api/submit-form/' + btn.dataset.id + '/restore', { method: 'POST', headers: auth() })
              .then(function (r) { return r.json(); })
              .then(function (b) {
                if (b && b.success) { toast('Enquiry restored', false); loadDeleted(); }
                else { throw new Error((b && b.message) || 'Restore failed'); }
              })
              .catch(function (err) { toast(err.message, true); btn.disabled = false; btn.textContent = 'Restore'; });
          });
        });
      })
      .catch(function () { tbody.innerHTML = '<tr><td colspan="4" class="text-danger">Could not load deleted enquiries.</td></tr>'; });
  }

  function injectButton() {
    if (!/\/view-form-data\//i.test(location.pathname)) return;
    if (document.getElementById(BTN_ID)) return;
    // Place next to the "Add Enquiry" button if present, else the table card header.
    var addBtn = [].slice.call(document.querySelectorAll('a, button')).find(function (b) {
      return /add enquiry/i.test((b.textContent || '').trim());
    });
    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.className = 'btn btn-sm btn-light-danger me-3';
    btn.textContent = 'Recently Deleted';
    btn.addEventListener('click', function () {
      ensureModal().style.display = 'flex';
      loadDeleted();
    });
    if (addBtn && addBtn.parentNode) {
      addBtn.parentNode.insertBefore(btn, addBtn);
    } else {
      var head = document.querySelector('#kt_app_content .card .card-header, #kt_app_content_container .card .card-header');
      if (head) head.appendChild(btn); else return;
    }
  }

  var observer = new MutationObserver(function () { injectButton(); });
  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    injectButton();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
