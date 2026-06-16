/**
 * Custom Email Templates addon.
 *
 *  1) Settings → Email Settings (/email-settings) — injects a "Custom Email
 *     Templates" manager BELOW the fixed reminder templates. Create / edit /
 *     delete reusable templates (name, subject, body) backed by
 *     /api/v1/email-templates. The fixed templates are never touched.
 *
 *  2) Student Profile (/profile/student/<id>) — injects a "Send Email" button.
 *     Pick a custom template, preview it with the student's data filled in
 *     (${studentName}, ${studentEmail}, ${courseName}, ${companyName}), then
 *     send it to the student's email via /api/email-templates/send-to-student.
 */
(function () {
  'use strict';

  var CRUD_API = '/api/v1/email-templates';
  var SEND_API = '/api/email-templates/send-to-student';
  var SETTINGS_ID = 'cet-settings-card';
  var PROFILE_CARD_ID = 'cet-profile-card';
  var MODAL_ID = 'cet-send-modal';

  var VARS = [
    { token: '${studentName}', label: "Student's name" },
    { token: '${studentEmail}', label: "Student's email" },
    { token: '${courseName}', label: 'Course name' },
    { token: '${companyName}', label: 'Institute / company name' },
  ];

  // ── Helpers ─────────────────────────────────────────────────────────────────
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
    var id = 'cet-toast';
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
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 500); }, 3200);
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

  function listTemplates() {
    return api('GET', CRUD_API + '?limit=100')
      .then(function (res) { return (res && res.data && res.data.templates) || []; });
  }
  function getTemplate(id) {
    return api('GET', CRUD_API + '/' + id).then(function (res) { return res && res.data; });
  }

  function varsHint() {
    return 'Placeholders: ' + VARS.map(function (v) { return v.token; }).join(', ') +
      ' — auto-filled with the student’s details when sent.';
  }

  // ── 1. Email Settings: CRUD manager ──────────────────────────────────────────
  function injectSettings() {
    if (!/^\/email-settings/.test(location.pathname)) return;
    if (document.getElementById(SETTINGS_ID)) return;
    var container = document.querySelector('#kt_app_content_container') ||
      document.querySelector('#kt_app_content') ||
      document.querySelector('.app-content');
    if (!container) return;

    var card = document.createElement('div');
    card.id = SETTINGS_ID;
    card.className = 'card mb-5 mb-xl-10';
    card.style.cssText = 'margin:24px;box-shadow:0 0 20px rgba(0,0,0,.05);';
    card.innerHTML =
      '<div class="card-header d-flex align-items-center justify-content-between">' +
        '<div><h2 class="fw-bold m-0">Custom Email Templates</h2>' +
          '<div class="text-muted fs-7 mt-1">Reusable templates you can send from a student’s profile.</div></div>' +
        '<button type="button" id="cet-add" class="btn btn-primary btn-sm">+ Add Template</button>' +
      '</div>' +
      '<div class="card-body">' +
        '<div id="cet-form-wrap" style="display:none;" class="border rounded p-5 mb-6 bg-light"></div>' +
        '<div class="table-responsive"><table class="table table-row-bordered align-middle gy-3">' +
          '<thead><tr class="fw-bold fs-7 text-gray-600 text-uppercase">' +
            '<th>Name</th><th>Subject</th><th class="text-center">Status</th><th class="text-end">Actions</th>' +
          '</tr></thead><tbody id="cet-tbody"><tr><td colspan="4" class="text-muted">Loading…</td></tr></tbody>' +
        '</table></div>' +
      '</div>';
    container.appendChild(card);

    card.querySelector('#cet-add').addEventListener('click', function () { showForm(null); });
    refreshList();
  }

  function refreshList() {
    var tbody = document.getElementById('cet-tbody');
    if (!tbody) return;
    listTemplates().then(function (rows) {
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-muted">No custom templates yet. Click “Add Template”.</td></tr>';
        return;
      }
      tbody.innerHTML = rows.map(function (t) {
        return '<tr>' +
          '<td class="fw-bold">' + esc(t.templateName) + '</td>' +
          '<td class="text-muted">' + esc(t.subject) + '</td>' +
          '<td class="text-center">' + (t.isActive
            ? '<span class="badge badge-light-success">Active</span>'
            : '<span class="badge badge-light">Inactive</span>') + '</td>' +
          '<td class="text-end">' +
            '<button type="button" class="btn btn-sm btn-light-primary me-2 cet-edit" data-id="' + esc(t.id) + '">Edit</button>' +
            '<button type="button" class="btn btn-sm btn-light-danger cet-del" data-id="' + esc(t.id) + '" data-name="' + esc(t.templateName) + '">Delete</button>' +
          '</td></tr>';
      }).join('');
      tbody.querySelectorAll('.cet-edit').forEach(function (b) {
        b.addEventListener('click', function () {
          getTemplate(b.dataset.id).then(function (full) { showForm(full); })
            .catch(function (e) { showToast(e.message, true); });
        });
      });
      tbody.querySelectorAll('.cet-del').forEach(function (b) {
        b.addEventListener('click', function () {
          if (!confirm('Delete template “' + b.dataset.name + '”?')) return;
          api('DELETE', CRUD_API + '/' + b.dataset.id)
            .then(function () { showToast('Template deleted', false); refreshList(); })
            .catch(function (e) { showToast(e.message, true); });
        });
      });
    }).catch(function (e) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-danger">' + esc(e.message) + '</td></tr>';
    });
  }

  function showForm(tpl) {
    var wrap = document.getElementById('cet-form-wrap');
    if (!wrap) return;
    var isEdit = !!tpl;
    wrap.innerHTML =
      '<h4 class="fw-bold mb-4">' + (isEdit ? 'Edit Template' : 'New Template') + '</h4>' +
      '<div class="row g-4">' +
        '<div class="col-md-6"><label class="form-label fw-semibold">Template Name</label>' +
          '<input id="cet-f-name" class="form-control form-control-solid" maxlength="100" value="' + esc(tpl ? tpl.templateName : '') + '" placeholder="e.g. Welcome Email" /></div>' +
        '<div class="col-md-6"><label class="form-label fw-semibold">Subject</label>' +
          '<input id="cet-f-subject" class="form-control form-control-solid" maxlength="500" value="' + esc(tpl ? tpl.subject : '') + '" placeholder="e.g. Welcome to ${companyName}" /></div>' +
        '<div class="col-12"><label class="form-label fw-semibold">Body</label>' +
          '<textarea id="cet-f-body" class="form-control form-control-solid" rows="8" placeholder="Dear ${studentName}, ...">' + esc(tpl ? tpl.body : '') + '</textarea>' +
          '<div class="text-muted fs-8 mt-1">' + esc(varsHint()) + '</div></div>' +
        '<div class="col-12"><label class="form-check form-switch form-check-custom form-check-solid">' +
          '<input id="cet-f-active" class="form-check-input" type="checkbox"' + (!tpl || tpl.isActive ? ' checked' : '') + ' />' +
          '<span class="form-check-label fw-semibold ms-3">Active</span></label></div>' +
      '</div>' +
      '<div class="d-flex justify-content-end gap-3 mt-5">' +
        '<button type="button" id="cet-f-cancel" class="btn btn-light">Cancel</button>' +
        '<button type="button" id="cet-f-save" class="btn btn-primary">' + (isEdit ? 'Update' : 'Create') + '</button>' +
      '</div>';
    wrap.style.display = 'block';
    wrap.querySelector('#cet-f-cancel').addEventListener('click', function () { wrap.style.display = 'none'; });
    wrap.querySelector('#cet-f-save').addEventListener('click', function () {
      var payload = {
        templateName: wrap.querySelector('#cet-f-name').value.trim(),
        subject: wrap.querySelector('#cet-f-subject').value.trim(),
        body: wrap.querySelector('#cet-f-body').value,
        isActive: wrap.querySelector('#cet-f-active').checked,
      };
      if (!payload.templateName || !payload.subject || !payload.body.trim()) {
        showToast('Name, subject and body are all required', true); return;
      }
      var req = isEdit ? api('PUT', CRUD_API + '/' + tpl.id, payload) : api('POST', CRUD_API + '/', payload);
      req.then(function () { showToast('Template saved', false); wrap.style.display = 'none'; refreshList(); })
        .catch(function (e) { showToast(e.message, true); });
    });
  }

  // ── 2. Student Profile: Send Email ───────────────────────────────────────────
  function profileStudentId() {
    var m = location.pathname.match(/\/profile\/student\/([^/?#]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function injectProfileButton() {
    if (!profileStudentId()) return;
    if (document.getElementById(PROFILE_CARD_ID)) return;
    var container = document.querySelector('#kt_app_content_container') ||
      document.querySelector('#kt_app_content') ||
      document.querySelector('.app-content');
    if (!container) return;

    var card = document.createElement('div');
    card.id = PROFILE_CARD_ID;
    card.className = 'card mb-5';
    card.style.cssText = 'margin:0 0 16px;box-shadow:0 0 20px rgba(0,0,0,.05);';
    card.innerHTML =
      '<div class="card-body d-flex flex-wrap align-items-center justify-content-between gap-3 py-4">' +
        '<div><span class="fw-bold fs-5">Email this student</span>' +
          '<div class="text-muted fs-7">Send one of your custom email templates.</div></div>' +
        '<button type="button" id="cet-send-btn" class="btn btn-primary"><i class="fa fa-paper-plane me-2"></i>Send Email</button>' +
      '</div>';
    container.insertBefore(card, container.firstChild);
    card.querySelector('#cet-send-btn').addEventListener('click', openSendModal);
  }

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
      '<div class="card" style="width:100%;max-width:720px;box-shadow:0 10px 40px rgba(0,0,0,.3);">' +
        '<div class="card-header d-flex align-items-center justify-content-between">' +
          '<h3 class="fw-bold m-0">Send Email</h3>' +
          '<button type="button" id="cet-m-close" class="btn btn-sm btn-icon btn-light">&times;</button>' +
        '</div>' +
        '<div class="card-body">' +
          '<label class="form-label fw-semibold">Template</label>' +
          '<select id="cet-m-select" class="form-select form-select-solid mb-5"></select>' +
          '<div id="cet-m-preview" class="border rounded p-5 bg-light" style="display:none;">' +
            '<div class="mb-3"><span class="text-muted fw-semibold fs-7">To:</span> <span id="cet-m-to" class="fw-bold"></span></div>' +
            '<div class="mb-3"><span class="text-muted fw-semibold fs-7">Subject:</span> <span id="cet-m-subject" class="fw-bold"></span></div>' +
            '<div><span class="text-muted fw-semibold fs-7">Message:</span>' +
              '<div id="cet-m-body" class="mt-2 p-3 bg-white border rounded" style="white-space:pre-wrap;max-height:300px;overflow:auto;"></div></div>' +
          '</div>' +
          '<div id="cet-m-empty" class="text-muted" style="display:none;">No active templates. Create one in Settings &rarr; Email Settings.</div>' +
        '</div>' +
        '<div class="card-footer d-flex justify-content-end gap-3">' +
          '<button type="button" id="cet-m-cancel" class="btn btn-light">Cancel</button>' +
          '<button type="button" id="cet-m-send" class="btn btn-primary" disabled>Send Email</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    overlay.querySelector('#cet-m-close').addEventListener('click', closeModal);
    overlay.querySelector('#cet-m-cancel').addEventListener('click', closeModal);
    overlay.querySelector('#cet-m-select').addEventListener('change', loadPreview);
    overlay.querySelector('#cet-m-send').addEventListener('click', doSend);
    return overlay;
  }
  function closeModal() { var m = document.getElementById(MODAL_ID); if (m) m.style.display = 'none'; }

  function openSendModal() {
    var m = ensureModal();
    m.style.display = 'flex';
    var sel = m.querySelector('#cet-m-select');
    var send = m.querySelector('#cet-m-send');
    var preview = m.querySelector('#cet-m-preview');
    var empty = m.querySelector('#cet-m-empty');
    sel.innerHTML = '<option value="">Loading…</option>';
    send.disabled = true; preview.style.display = 'none'; empty.style.display = 'none';
    listTemplates().then(function (rows) {
      var active = rows.filter(function (t) { return t.isActive; });
      if (!active.length) { sel.innerHTML = ''; empty.style.display = 'block'; return; }
      sel.innerHTML = '<option value="">— Select a template —</option>' +
        active.map(function (t) { return '<option value="' + esc(t.templateName) + '">' + esc(t.templateName) + '</option>'; }).join('');
    }).catch(function (e) { sel.innerHTML = '<option value="">' + esc(e.message) + '</option>'; });
  }

  function loadPreview() {
    var m = document.getElementById(MODAL_ID);
    var name = m.querySelector('#cet-m-select').value;
    var preview = m.querySelector('#cet-m-preview');
    var send = m.querySelector('#cet-m-send');
    send.disabled = true;
    if (!name) { preview.style.display = 'none'; return; }
    api('POST', SEND_API, { templateName: name, studentId: profileStudentId(), preview: true })
      .then(function (res) {
        var p = (res && res.preview) || {};
        m.querySelector('#cet-m-to').textContent = p.to || '(no email on file)';
        m.querySelector('#cet-m-subject').textContent = p.subject || '';
        m.querySelector('#cet-m-body').textContent = p.body || '';
        preview.style.display = 'block';
        send.disabled = !p.to;
        if (!p.to) showToast('This student has no email address on file', true);
      })
      .catch(function (e) { showToast(e.message, true); });
  }

  function doSend() {
    var m = document.getElementById(MODAL_ID);
    var name = m.querySelector('#cet-m-select').value;
    var send = m.querySelector('#cet-m-send');
    if (!name) return;
    send.disabled = true;
    var orig = send.textContent; send.textContent = 'Sending…';
    api('POST', SEND_API, { templateName: name, studentId: profileStudentId() })
      .then(function (res) { showToast((res && res.message) || 'Email sent', false); closeModal(); })
      .catch(function (e) { showToast(e.message, true); send.disabled = false; })
      .then(function () { send.textContent = orig; });
  }

  // ── Boot ─────────────────────────────────────────────────────────────────────
  function tick() { injectSettings(); injectProfileButton(); }
  var observer = new MutationObserver(tick);
  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    tick();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
