/**
 * Custom Fields addon (per-company, per form-type).
 *
 *  1) Management UI — a "Custom Fields" item in the Settings sidebar menu opens a
 *     manager with a Company selector and a Form Type selector (Admission / Enquiry).
 *     Fields are added / edited / deleted for the chosen company + form type. Each
 *     field has a name, a type and a "Compulsory" toggle.
 *     Backed by /api/v1/custom-fields (scoped by companyId + formType).
 *
 *  2) Admission form (/add-... admission) — injects a "Personal Details" section
 *     before "Qualification" with the company's formType=admission fields. Submitted
 *     as a `customFields` JSON object on the admission FormData.
 *
 *  3) Enquiry form (/add-enquiry/<companyId>) — injects an "Additional Details"
 *     section with the company's formType=enquiry fields, captured into the JSON
 *     submit to /submit-form/enquiry-form as { fieldName: { newValue, type } }.
 *
 * This is intentionally a separate field set from the legacy "Add Form" builder.
 */
(function () {
  'use strict';

  var API = '/api/v1/custom-fields';
  var MENU_ID = 'cf-menu-item';
  var MODAL_ID = 'cf-modal';
  var ADM_SECTION_ID = 'cf-personal-details';
  var ENQ_SECTION_ID = 'cf-enquiry-details';

  var FIELD_TYPES = [
    { v: 'text', label: 'Text' },
    { v: 'textarea', label: 'Text Area' },
    { v: 'number', label: 'Number' },
    { v: 'currency', label: 'Currency' },
    { v: 'email', label: 'Email' },
    { v: 'url', label: 'URL' },
    { v: 'date', label: 'Date' },
    { v: 'select', label: 'Dropdown (Select)' },
    { v: 'radio', label: 'Radio' },
    { v: 'checkbox', label: 'Checkbox' },
  ];
  var TYPES_WITH_OPTIONS = ['select', 'radio', 'checkbox'];

  var companiesCache = null;          // [{_id, companyName}]
  var formsCache = null;              // [{_id, formName, companyName}]
  var fieldsCache = {};               // (companyId::formType::formId) -> field defs
  var managerCompanyId = null;
  var managerFormType = 'admission';
  var managerFormId = null;           // selected enquiry form (enquiry only)

  function ckey(companyId, formType, formId) {
    return String(companyId) + '::' + formType + '::' + (formId || '');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
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
        if (val && val.length > 20 && val.indexOf('.') !== -1 &&
            keys[i].toLowerCase().indexOf('token') !== -1) {
          return 'Bearer ' + val;
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
    var id = 'cf-toast';
    var existing = document.getElementById(id);
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = id;
    toast.textContent = msg;
    toast.style.cssText = [
      'position:fixed', 'bottom:24px', 'right:24px', 'z-index:100001',
      'padding:12px 20px', 'border-radius:8px', 'font-size:14px', 'font-weight:600',
      'color:#fff', 'box-shadow:0 4px 16px rgba(0,0,0,.3)', 'transition:opacity .4s',
      isError ? 'background:#dc3545' : 'background:#198754',
    ].join(';');
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 500);
    }, 3000);
  }

  function api(method, path, body) {
    return fetch(API + path, {
      method: method,
      headers: { 'Content-Type': 'application/json', Authorization: getAuthHeader() },
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) {
      return r.json().then(function (b) {
        if (!r.ok) throw new Error((b && b.error && b.error.message) || (b && b.message) || ('HTTP ' + r.status));
        return b;
      });
    });
  }

  // Persist a new field order. Posts to the legacy gateway (not /api/v1) so both
  // read paths — GET /custom-field (enquiry form bundle) and the DDD list (admission
  // + this modal) — pick up the order, which they sort by.
  function reorderFields(ids) {
    return fetch('/api/custom-field/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: getAuthHeader() },
      body: JSON.stringify({ ids: ids }),
    }).then(function (r) {
      return r.json().then(function (b) {
        if (!r.ok || !b || b.success === false) {
          throw new Error((b && b.message) || ('HTTP ' + r.status));
        }
        return b;
      });
    });
  }

  var companiesPromise = null;
  function loadCompanies() {
    // Only treat a NON-EMPTY result as cached. An empty array (e.g. the call fired
    // before auth was ready, or a 401) must not be cached — otherwise the dropdown
    // stays empty forever. An in-flight guard avoids duplicate concurrent fetches.
    if (companiesCache && companiesCache.length) return Promise.resolve(companiesCache);
    if (companiesPromise) return companiesPromise;
    companiesPromise = fetch('/api/company', { headers: { Authorization: getAuthHeader() } })
      .then(function (r) { return r.json(); })
      .then(function (list) {
        companiesPromise = null;
        var arr = (Array.isArray(list) ? list : []).map(function (c) {
          return { _id: String(c._id), companyName: c.companyName || '(unnamed)' };
        });
        if (arr.length) companiesCache = arr;
        return arr;
      })
      .catch(function () { companiesPromise = null; return companiesCache || []; });
    return companiesPromise;
  }

  function loadFields(companyId, formType, formId) {
    var q = '/?limit=100&companyId=' + encodeURIComponent(companyId || '') +
      '&formType=' + encodeURIComponent(formType);
    if (formId) q += '&formId=' + encodeURIComponent(formId);
    return api('GET', q).then(function (res) { return (res && res.data && res.data.fields) || []; });
  }

  var formsPromise = null;
  function loadAllForms() {
    if (formsCache && formsCache.length) return Promise.resolve(formsCache);
    if (formsPromise) return formsPromise;
    formsPromise = fetch('/api/add-form', { headers: { Authorization: getAuthHeader() } })
      .then(function (r) { return r.json(); })
      .then(function (list) {
        formsPromise = null;
        var arr = (Array.isArray(list) ? list : []).map(function (f) {
          return { _id: String(f._id), formName: f.formName || '(unnamed form)', companyName: String(f.companyName || '') };
        });
        if (arr.length) formsCache = arr;
        return arr;
      })
      .catch(function () { formsPromise = null; return formsCache || []; });
    return formsPromise;
  }

  function parseOptions(raw) {
    return String(raw || '').split(/[\n,]/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove(); resolve();
      } catch (e) { reject(e); }
    });
  }

  function slugify(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  // Build a short, readable public enquiry link for the form currently open in the
  // editor: /enquiry/<company-slug>/<form-slug> (e.g. /enquiry/visual-media-academy/enquiry).
  // The server resolves these slugs (falling back to ids), so old id links still work.
  // Form-editor URLs (/profile-form, /add-form, /enquiry-form) carry the FORM id.
  function buildPublicLink(cb) {
    var m = (location.pathname + location.hash).match(/\/(?:profile-form|add-form|enquiry-form)\/([^\/?#]+)/);
    var formId = m ? decodeURIComponent(m[1]) : null;
    if (!formId) { cb(null); return; }
    Promise.all([loadAllForms(), loadCompanies()]).then(function (res) {
      var all = res[0], companies = res[1];
      var form = all.find(function (f) { return f._id === formId; });
      var companyId = form ? form.companyName : null;
      if (!companyId) { cb(null); return; }
      var comp = companies.find(function (c) { return c._id === companyId; });
      var cSlug = comp ? slugify(comp.companyName) : companyId;
      var fSlug = form && form.formName ? slugify(form.formName) : formId;
      cb(location.origin + '/enquiry/' + cSlug + '/' + fSlug);
    }).catch(function () { cb(null); });
  }

  // ── 1. Management modal ─────────────────────────────────────────────────────────
  function ensureModal() {
    if (document.getElementById(MODAL_ID)) return document.getElementById(MODAL_ID);

    var overlay = document.createElement('div');
    overlay.id = MODAL_ID;
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:100000', 'display:none',
      'align-items:flex-start', 'justify-content:center',
      'background:rgba(0,0,0,.5)', 'overflow:auto', 'padding:40px 16px',
    ].join(';');

    overlay.innerHTML =
      '<div class="card" style="width:100%;max-width:900px;box-shadow:0 10px 40px rgba(0,0,0,.3);">' +
        '<div class="card-header d-flex align-items-center justify-content-between">' +
          '<h3 class="fw-bold m-0">Custom Fields</h3>' +
          '<button type="button" id="cf-close" class="btn btn-sm btn-icon btn-light">&times;</button>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="row align-items-end mb-5 g-4">' +
            '<div class="col-md-4">' +
              '<label class="form-label fw-semibold">Company</label>' +
              '<select id="cf-company" class="form-select form-select-solid"></select>' +
            '</div>' +
            '<div class="col-md-3">' +
              '<label class="form-label fw-semibold">Form Type</label>' +
              '<select id="cf-formtype" class="form-select form-select-solid">' +
                '<option value="admission">Admission Form</option>' +
                '<option value="enquiry">Enquiry Form</option>' +
              '</select>' +
            '</div>' +
            '<div class="col-md-3" id="cf-enqform-wrap" style="display:none;">' +
              '<label class="form-label fw-semibold">Enquiry Form</label>' +
              '<select id="cf-enqform" class="form-select form-select-solid"></select>' +
            '</div>' +
            '<div class="col-md-2 text-md-end">' +
              '<button type="button" id="cf-add-btn" class="btn btn-primary btn-sm">+ Add Field</button>' +
            '</div>' +
          '</div>' +
          '<div id="cf-form-wrap" style="display:none;" class="border rounded p-5 mb-6 bg-light"></div>' +
          '<div class="table-responsive">' +
            '<table class="table table-row-bordered align-middle gy-3">' +
              '<thead><tr class="fw-bold fs-7 text-gray-600 text-uppercase">' +
                '<th>Field Name</th><th>Type</th><th>Options</th><th class="text-center">Compulsory</th><th class="text-end">Actions</th>' +
              '</tr></thead>' +
              '<tbody id="cf-tbody"><tr><td colspan="5" class="text-muted">Loading…</td></tr></tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    overlay.querySelector('#cf-close').addEventListener('click', closeModal);
    overlay.querySelector('#cf-add-btn').addEventListener('click', function () {
      if (!managerCompanyId) { showToast('Select a company first', true); return; }
      if (managerFormType === 'enquiry' && !managerFormId) { showToast('Select an enquiry form first', true); return; }
      showFieldForm(null);
    });
    function onScopeChange() {
      managerCompanyId = overlay.querySelector('#cf-company').value;
      managerFormType = overlay.querySelector('#cf-formtype').value;
      var wrap = document.getElementById('cf-form-wrap');
      if (wrap) wrap.style.display = 'none';
      populateEnquiryForms().then(refreshTable);
    }
    overlay.querySelector('#cf-company').addEventListener('change', onScopeChange);
    overlay.querySelector('#cf-formtype').addEventListener('change', onScopeChange);
    overlay.querySelector('#cf-enqform').addEventListener('change', function () {
      managerFormId = this.value || null;
      var wrap = document.getElementById('cf-form-wrap');
      if (wrap) wrap.style.display = 'none';
      refreshTable();
    });

    return overlay;
  }

  // Show/populate the Enquiry Form selector based on the current company + form type.
  function populateEnquiryForms() {
    var wrap = document.getElementById('cf-enqform-wrap');
    var sel = document.getElementById('cf-enqform');
    if (!wrap || !sel) return Promise.resolve();
    if (managerFormType !== 'enquiry') {
      wrap.style.display = 'none';
      managerFormId = null;
      return Promise.resolve();
    }
    wrap.style.display = 'block';
    return loadAllForms().then(function (all) {
      var forms = all.filter(function (f) { return f.companyName === String(managerCompanyId); });
      sel.innerHTML = forms.length
        ? forms.map(function (f) { return '<option value="' + esc(f._id) + '">' + esc(f.formName) + '</option>'; }).join('')
        : '<option value="">No enquiry forms for this company</option>';
      if (!managerFormId || !forms.some(function (f) { return f._id === managerFormId; })) {
        managerFormId = forms.length ? forms[0]._id : null;
      }
      sel.value = managerFormId || '';
    });
  }

  function openModal() {
    var m = ensureModal();
    m.style.display = 'flex';
    m.querySelector('#cf-form-wrap').style.display = 'none';
    m.querySelector('#cf-formtype').value = managerFormType;
    loadCompanies().then(function (companies) {
      var sel = m.querySelector('#cf-company');
      sel.innerHTML = companies.length
        ? companies.map(function (c) { return '<option value="' + esc(c._id) + '">' + esc(c.companyName) + '</option>'; }).join('')
        : '<option value="">No companies found</option>';
      // Prefer the company referenced in the current page URL (e.g. /view-form/<companyId>,
      // /students/<companyId>) so the modal opens on the relevant company.
      var urlIds = location.pathname.match(/[a-f0-9]{24}/gi) || [];
      var urlCompany = urlIds.filter(function (id) {
        return companies.some(function (c) { return c._id === id; });
      })[0];
      if (urlCompany) {
        managerCompanyId = urlCompany;
      } else if (!managerCompanyId || !companies.some(function (c) { return c._id === managerCompanyId; })) {
        managerCompanyId = companies.length ? companies[0]._id : null;
      }
      sel.value = managerCompanyId || '';
      populateEnquiryForms().then(refreshTable);
    });
  }
  function closeModal() {
    var m = document.getElementById(MODAL_ID);
    if (m) m.style.display = 'none';
  }

  function refreshTable() {
    var tbody = document.getElementById('cf-tbody');
    if (!tbody) return;
    if (!managerCompanyId) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-muted">Select a company.</td></tr>';
      return;
    }
    if (managerFormType === 'enquiry' && !managerFormId) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-muted">Select an enquiry form.</td></tr>';
      return;
    }
    var scopeCompany = managerCompanyId, scopeType = managerFormType, scopeForm = managerFormId;
    loadFields(scopeCompany, scopeType, scopeForm)
      .then(function (fields) {
        fieldsCache[ckey(scopeCompany, scopeType, scopeForm)] = fields;
        if (managerCompanyId !== scopeCompany || managerFormType !== scopeType || managerFormId !== scopeForm) return;
        if (!fields.length) {
          tbody.innerHTML = '<tr><td colspan="5" class="text-muted">No ' + esc(scopeType) +
            ' fields here yet. Click “Add Field”.</td></tr>';
          return;
        }
        tbody.innerHTML = fields.map(function (f, i) {
          var typeLabel = (FIELD_TYPES.find(function (t) { return t.v === f.fieldType; }) || {}).label || f.fieldType;
          var up = '<button type="button" class="btn btn-icon btn-sm btn-light cf-up" data-idx="' + i + '"' +
            (i === 0 ? ' disabled' : '') + ' title="Move up">&uarr;</button>';
          var down = '<button type="button" class="btn btn-icon btn-sm btn-light cf-down me-3" data-idx="' + i + '"' +
            (i === fields.length - 1 ? ' disabled' : '') + ' title="Move down">&darr;</button>';
          return '<tr>' +
            '<td class="fw-bold">' + esc(f.fieldName) + '</td>' +
            '<td>' + esc(typeLabel) + '</td>' +
            '<td class="text-muted">' + esc((f.options || []).join(', ')) + '</td>' +
            '<td class="text-center">' + (f.mandatory
              ? '<span class="badge badge-light-danger">Required</span>'
              : '<span class="badge badge-light">Optional</span>') + '</td>' +
            '<td class="text-end text-nowrap">' + up + down +
              '<button type="button" class="btn btn-sm btn-light-primary me-2 cf-edit" data-id="' + esc(f.id) + '">Edit</button>' +
              '<button type="button" class="btn btn-sm btn-light-danger cf-del" data-id="' + esc(f.id) + '">Delete</button>' +
            '</td></tr>';
        }).join('');

        // Move a field up/down: swap with its neighbour, persist the new order, reload.
        function move(idx, delta) {
          var j = idx + delta;
          if (j < 0 || j >= fields.length) return;
          var ids = fields.map(function (x) { return x.id; });
          var tmp = ids[idx]; ids[idx] = ids[j]; ids[j] = tmp;
          reorderFields(ids)
            .then(function () {
              delete fieldsCache[ckey(scopeCompany, scopeType, scopeForm)];
              refreshTable();
            })
            .catch(function (err) { showToast(err.message, true); });
        }
        tbody.querySelectorAll('.cf-up').forEach(function (btn) {
          btn.addEventListener('click', function () { move(Number(btn.dataset.idx), -1); });
        });
        tbody.querySelectorAll('.cf-down').forEach(function (btn) {
          btn.addEventListener('click', function () { move(Number(btn.dataset.idx), 1); });
        });

        tbody.querySelectorAll('.cf-edit').forEach(function (btn) {
          btn.addEventListener('click', function () {
            showFieldForm(fields.find(function (x) { return x.id === btn.dataset.id; }));
          });
        });
        tbody.querySelectorAll('.cf-del').forEach(function (btn) {
          btn.addEventListener('click', function () {
            if (!confirm('Delete this custom field? Existing data is kept.')) return;
            api('DELETE', '/' + btn.dataset.id)
              .then(function () { showToast('Field deleted', false); refreshTable(); })
              .catch(function (err) { showToast(err.message, true); });
          });
        });
      })
      .catch(function (err) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-danger">' + esc(err.message) + '</td></tr>';
      });
  }

  function showFieldForm(field) {
    var wrap = document.getElementById('cf-form-wrap');
    if (!wrap) return;
    var isEdit = !!field;
    var typeOpts = FIELD_TYPES.map(function (t) {
      return '<option value="' + t.v + '"' + (field && field.fieldType === t.v ? ' selected' : '') + '>' + t.label + '</option>';
    }).join('');

    wrap.innerHTML =
      '<h4 class="fw-bold mb-4">' + (isEdit ? 'Edit Field' : 'New Field') + '</h4>' +
      '<div class="row g-4">' +
        '<div class="col-md-6">' +
          '<label class="form-label fw-semibold">Field Name</label>' +
          '<input id="cf-f-name" type="text" class="form-control form-control-solid" maxlength="200" value="' + esc(field ? field.fieldName : '') + '" placeholder="e.g. Passport Number" />' +
        '</div>' +
        '<div class="col-md-6">' +
          '<label class="form-label fw-semibold">Field Type</label>' +
          '<select id="cf-f-type" class="form-select form-select-solid">' + typeOpts + '</select>' +
        '</div>' +
        '<div class="col-12" id="cf-f-options-wrap">' +
          '<label class="form-label fw-semibold">Options <span class="text-muted fw-normal">(one per line or comma-separated)</span></label>' +
          '<textarea id="cf-f-options" class="form-control form-control-solid" rows="3" placeholder="Option 1\nOption 2">' + esc(field ? (field.options || []).join('\n') : '') + '</textarea>' +
        '</div>' +
        '<div class="col-12">' +
          '<label class="form-check form-switch form-check-custom form-check-solid">' +
            '<input id="cf-f-mandatory" class="form-check-input" type="checkbox"' + (field && field.mandatory ? ' checked' : '') + ' />' +
            '<span class="form-check-label fw-semibold ms-3">Make this field compulsory</span>' +
          '</label>' +
        '</div>' +
      '</div>' +
      '<div class="d-flex justify-content-end gap-3 mt-5">' +
        '<button type="button" id="cf-f-cancel" class="btn btn-light">Cancel</button>' +
        '<button type="button" id="cf-f-save" class="btn btn-primary">' + (isEdit ? 'Update Field' : 'Create Field') + '</button>' +
      '</div>';

    wrap.style.display = 'block';

    var typeSel = wrap.querySelector('#cf-f-type');
    var optWrap = wrap.querySelector('#cf-f-options-wrap');
    function syncOptions() {
      optWrap.style.display = TYPES_WITH_OPTIONS.indexOf(typeSel.value) !== -1 ? 'block' : 'none';
    }
    typeSel.addEventListener('change', syncOptions);
    syncOptions();

    wrap.querySelector('#cf-f-cancel').addEventListener('click', function () { wrap.style.display = 'none'; });
    wrap.querySelector('#cf-f-save').addEventListener('click', function () {
      var name = wrap.querySelector('#cf-f-name').value.trim();
      var type = typeSel.value;
      var mandatory = wrap.querySelector('#cf-f-mandatory').checked;
      var options = TYPES_WITH_OPTIONS.indexOf(type) !== -1 ? parseOptions(wrap.querySelector('#cf-f-options').value) : [];
      if (!name) { showToast('Field name is required', true); return; }
      if (TYPES_WITH_OPTIONS.indexOf(type) !== -1 && options.length === 0) {
        showToast('Please add at least one option for this field type', true); return;
      }
      var payload = { fieldName: name, fieldType: type, options: options, mandatory: mandatory };
      if (!isEdit) {
        payload.companyId = managerCompanyId;
        payload.formType = managerFormType;
        if (managerFormType === 'enquiry') payload.formId = managerFormId;
      }
      var req = isEdit ? api('PUT', '/' + field.id, payload) : api('POST', '/', payload);
      req.then(function () {
        showToast('Field saved', false);
        wrap.style.display = 'none';
        delete fieldsCache[ckey(managerCompanyId, managerFormType, managerFormId)];
        refreshTable();
      }).catch(function (err) { showToast(err.message, true); });
    });
  }

  // ── 2. Sidebar menu item (under Settings) ────────────────────────────────────────
  function injectMenu() {
    if (document.getElementById(MENU_ID)) return;
    var anchor =
      document.querySelector('a.menu-link[href="/general-settings"]') ||
      document.querySelector('a.menu-link[href="/email-settings"]') ||
      document.querySelector('a.menu-link[href="/auth-settings"]') ||
      document.querySelector('a.menu-link[href="/fixed-installment-settings"]');
    if (!anchor) return;
    var item = anchor.closest('.menu-item');
    if (!item || !item.parentNode) return;

    var clone = item.cloneNode(true);
    clone.id = MENU_ID;
    var link = clone.querySelector('a.menu-link');
    if (link) { link.setAttribute('href', '#'); link.classList.remove('active'); }
    var title = clone.querySelector('.menu-title');
    if (title) title.textContent = 'Custom Fields';
    var badge = clone.querySelector('.menu-badge, .badge');
    if (badge) badge.remove();

    clone.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openModal();
    });

    item.parentNode.insertBefore(clone, item.nextSibling);
  }

  // ── 3. Field rendering (shared) ──────────────────────────────────────────────────
  function fieldInputHtml(f) {
    var name = esc(f.fieldName);
    var id = 'cf-in-' + esc(f.id);
    var reqMark = f.mandatory ? ' <span class="text-danger">*</span>' : '';
    var attrs = 'id="' + id + '" data-cf-name="' + name + '" data-cf-type="' + esc(f.fieldType) +
      '" data-cf-mandatory="' + (f.mandatory ? '1' : '0') + '"';
    var inner;

    switch (f.fieldType) {
      case 'textarea':
        inner = '<textarea ' + attrs + ' class="form-control form-control-solid" rows="3" placeholder="Enter ' + name + '"></textarea>';
        break;
      case 'select':
        inner = '<select ' + attrs + ' class="form-select form-select-solid"><option value="">Select ' + name + '</option>' +
          (f.options || []).map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + '</option>'; }).join('') + '</select>';
        break;
      case 'radio':
        inner = '<div ' + attrs + ' class="d-flex flex-wrap gap-4 pt-2">' +
          (f.options || []).map(function (o) {
            return '<label class="form-check form-check-inline form-check-solid">' +
              '<input class="form-check-input" type="radio" name="' + id + '" value="' + esc(o) + '" />' +
              '<span class="form-check-label">' + esc(o) + '</span></label>';
          }).join('') + '</div>';
        break;
      case 'checkbox':
        if (f.options && f.options.length) {
          inner = '<div ' + attrs + ' class="d-flex flex-wrap gap-4 pt-2">' +
            f.options.map(function (o) {
              return '<label class="form-check form-check-inline form-check-solid">' +
                '<input class="form-check-input" type="checkbox" value="' + esc(o) + '" />' +
                '<span class="form-check-label">' + esc(o) + '</span></label>';
            }).join('') + '</div>';
        } else {
          inner = '<div class="form-check form-check-solid pt-2"><input ' + attrs + ' class="form-check-input" type="checkbox" value="Yes" /></div>';
        }
        break;
      case 'date':
        inner = '<input ' + attrs + ' type="date" class="form-control form-control-solid" />';
        break;
      case 'number':
      case 'currency':
        inner = '<input ' + attrs + ' type="number" class="form-control form-control-solid" placeholder="Enter ' + name + '" />';
        break;
      case 'email':
        inner = '<input ' + attrs + ' type="email" class="form-control form-control-solid" placeholder="Enter ' + name + '" />';
        break;
      case 'url':
        inner = '<input ' + attrs + ' type="url" class="form-control form-control-solid" placeholder="Enter ' + name + '" />';
        break;
      default:
        inner = '<input ' + attrs + ' type="text" class="form-control form-control-solid" placeholder="Enter ' + name + '" />';
    }

    return '<div class="col-md-6 mb-6" data-cf-field>' +
      '<label class="fw-bold fs-6 mb-2 d-block">' + name + reqMark + '</label>' + inner + '</div>';
  }

  function buildSection(sectionId, title, companyId, fields) {
    var card = document.createElement('div');
    card.id = sectionId;
    card.className = 'card mb-5 mb-xl-10';
    card.dataset.company = companyId || '';
    var body;
    if (!companyId) {
      body = '<div class="text-muted">Select a company to load its custom fields.</div>';
    } else if (!fields || !fields.length) {
      body = '<div class="text-muted">No custom fields configured for this company. Add them from Settings → Custom Fields.</div>';
    } else {
      body = '<div class="row">' + fields.map(fieldInputHtml).join('') + '</div>';
    }
    card.innerHTML =
      '<div class="card-header"><div class="card-title m-0"><h3 class="fw-bolder m-0">' + esc(title) + '</h3></div></div>' +
      '<div class="card-body">' + body + '</div>';
    return card;
  }

  // ── 3a. Admission form section ───────────────────────────────────────────────────
  function getAdmissionCompanyId() {
    if (!companiesCache || !companiesCache.length) return null;
    var byId = {}, byName = {};
    companiesCache.forEach(function (c) { byId[c._id] = c._id; byName[c.companyName.trim().toLowerCase()] = c._id; });

    // The admission add/edit routes carry the company id directly in the URL:
    //   /addmission-form/<companyId>  (Add New Student)
    //   /update-addmission-form/<companyId>  (Edit Profile)
    // These pages have no company <select> (the company is fixed), so the URL is the
    // reliable source. Check it first; fall back to a company-looking select otherwise.
    var um = (location.pathname + location.hash)
      .match(/\/(?:update-addmission-form|addmission-form)\/([a-f0-9]{24})/i);
    if (um && byId[um[1]]) return byId[um[1]];

    // On the student profile page (/profile/student/<id>) the URL carries the student
    // id, not the company. The page links to /addmission-form/<companyId> (its Edit
    // action), so read the company id from that link.
    var editLink = document.querySelector('a[href*="addmission-form/"]');
    if (editLink) {
      var dm = (editLink.getAttribute('href') || '').match(/addmission-form\/([a-f0-9]{24})/i);
      if (dm && byId[dm[1]]) return byId[dm[1]];
    }

    var selects = document.querySelectorAll('select');
    for (var i = 0; i < selects.length; i++) {
      var sel = selects[i];
      if (sel.closest('#' + MODAL_ID) || sel.closest('#' + ADM_SECTION_ID)) continue;
      var looksCompany = false;
      for (var j = 0; j < sel.options.length; j++) {
        var v = String(sel.options[j].value).trim();
        var t = String(sel.options[j].text).trim().toLowerCase();
        if (byId[v] || byName[t]) { looksCompany = true; break; }
      }
      if (!looksCompany) continue;
      var val = String(sel.value).trim();
      if (byId[val]) return byId[val];
      var opt = sel.options[sel.selectedIndex];
      return (opt ? byName[String(opt.text).trim().toLowerCase()] : null) || null;
    }
    return null;
  }

  function admissionAnchor() {
    var headers = document.querySelectorAll('.card-header h3.fw-bolder');
    for (var i = 0; i < headers.length; i++) {
      if (headers[i].textContent.trim() === 'Qualification') {
        var row = headers[i].closest('.row');
        if (row && row.parentNode) return { parent: row.parentNode, before: row };
      }
    }
    return null;
  }

  // ── 3b. Enquiry form section ─────────────────────────────────────────────────────
  // The /add-enquiry/<id> URL param is the COMPANY id (the form is chosen on the page).
  // We also tolerate it being a form id, for safety.
  function getEnquiryRawId() {
    var loc = location.pathname + location.hash;
    var m = loc.match(/\/(?:add-enquiry|enquiry-form|profile-form)\/([^\/?#]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  // Pick the form currently shown on the enquiry page: match a form name appearing
  // in a page heading (breadcrumb "Company -> Form"); otherwise the company's first form.
  function pickActiveForm(forms) {
    if (!forms.length) return null;
    var heads = document.querySelectorAll('h1,h2,h3,h4,h5,.fw-bold,.fw-bolder');
    for (var i = 0; i < heads.length; i++) {
      if (heads[i].closest('#' + MODAL_ID)) continue;
      var txt = heads[i].textContent || '';
      if (txt.indexOf('-') === -1 && txt.indexOf('→') === -1 && txt.indexOf('➜') === -1) continue;
      for (var k = 0; k < forms.length; k++) {
        var fn = (forms[k].formName || '').trim();
        if (fn && txt.indexOf(fn) !== -1) return forms[k]._id;
      }
    }
    return forms[0]._id;
  }

  // Resolve { companyId, formId } for the current enquiry page.
  function resolveEnquiryContext() {
    var rawId = getEnquiryRawId();
    if (!rawId) return Promise.resolve(null);
    return Promise.all([loadCompanies(), loadAllForms()]).then(function (res) {
      var companies = res[0], forms = res[1];
      // Param is a company id (normal /add-enquiry case).
      if (companies.some(function (c) { return c._id === rawId; })) {
        var companyForms = forms.filter(function (f) { return f.companyName === rawId; });
        return { companyId: rawId, formId: pickActiveForm(companyForms) };
      }
      // Param is a form id (fallback).
      var form = forms.find(function (f) { return f._id === rawId; });
      if (form) return { companyId: form.companyName, formId: form._id };
      return { companyId: null, formId: null };
    });
  }

  function enquiryAnchor() {
    var content = document.querySelector('#kt_app_content_container') ||
      document.querySelector('#kt_app_content');
    if (!content) return null;
    // Prefer: right after the form card (its heading is a breadcrumb with an arrow,
    // e.g. "Visual Media Academy -> Enquiry").
    var cards = content.querySelectorAll('.card');
    for (var c = 0; c < cards.length; c++) {
      var card = cards[c];
      if (card.id === 'cf-legacy-note' || card.id === ENQ_SECTION_ID || card.id === ADM_SECTION_ID) continue;
      var hd = card.querySelector('h1,h2,h3,.card-title');
      if (hd && /→|➜|->/.test(hd.textContent) && card.parentNode) {
        return { parent: card.parentNode, before: card.nextSibling };
      }
    }
    // Else: before the form's submit button; else append to the form / content.
    var btns = content.querySelectorAll('button, input[type=submit]');
    for (var i = 0; i < btns.length; i++) {
      var lbl = (btns[i].textContent || btns[i].value || '').trim().toLowerCase();
      if (btns[i].type === 'submit' || lbl === 'submit' || lbl === 'save' || /enquir/.test(lbl)) {
        var holder = btns[i].closest('.row, .card, .d-flex, form') || btns[i].parentNode;
        if (holder && holder.parentNode) return { parent: holder.parentNode, before: holder };
      }
    }
    var form = content.querySelector('form');
    if (form) return { parent: form, before: null };
    return { parent: content, before: null };
  }

  function renderContext(sectionId, title, companyId, formType, formId, anchorFn) {
    // A stamp captures the rendered state. If the section is already in this exact
    // state we do nothing — critical to avoid an infinite MutationObserver loop
    // (each replaceChild would otherwise trigger another render).
    var stamp = (companyId || '') + '|' + (formId || '') + '|' + (fieldsCache[ckey(companyId, formType, formId)] ? 'f' : '0');
    var existing = document.getElementById(sectionId);
    if (existing && existing.dataset.stamp === stamp) return;

    function place(fields, st) {
      var built = buildSection(sectionId, title, companyId, fields);
      built.dataset.company = companyId || '';
      built.dataset.form = formId || '';
      built.dataset.stamp = st;
      var cur = document.getElementById(sectionId);
      if (cur && cur.parentNode) { cur.parentNode.replaceChild(built, cur); return; }
      var a = anchorFn();
      if (!a) return;
      if (a.before) a.parent.insertBefore(built, a.before);
      else a.parent.appendChild(built);
    }

    if (!companyId) { place(null, stamp); return; }

    var key = ckey(companyId, formType, formId);
    if (fieldsCache[key]) {
      place(fieldsCache[key], stamp);
    } else {
      place(null, stamp); // placeholder while loading (stamp set → no loop)
      loadFields(companyId, formType, formId).then(function (fields) {
        fieldsCache[key] = fields;
        var cur = document.getElementById(sectionId);
        if (cur && cur.dataset.company === (companyId || '') && cur.dataset.form === (formId || '')) {
          place(fields, (companyId || '') + '|' + (formId || '') + '|f');
        }
      }).catch(function () { /* leave placeholder */ });
    }
  }

  function maybeRender() {
    if (!companiesCache) {
      loadCompanies().then(function (arr) { if (arr && arr.length) maybeRender(); });
      return;
    }

    // Enquiry form: the application bundle now renders enquiry custom fields natively
    // in the main form (and submits them to /api/submit-form as { newValue, type }),
    // so the addon must NOT render an "Additional Details" copy — doing so produced
    // duplicate fields on the page. (The addon's submit hook below targets a different
    // URL and never fired for enquiry, so its copy was non-functional anyway.) We still
    // detect the enquiry page here to avoid falling through to the admission branch, and
    // remove any section left over from a previously cached addon version.
    if (getEnquiryRawId()) {
      var staleEnq = document.getElementById(ENQ_SECTION_ID);
      if (staleEnq) staleEnq.remove();
      return;
    }

    // Admission form? (detected by the Qualification anchor)
    if (admissionAnchor()) {
      renderContext(ADM_SECTION_ID, 'Personal Details', getAdmissionCompanyId(), 'admission', null, admissionAnchor);
      // On the student profile (Edit Profile) page, prefill the inputs with the
      // student's saved custom-field values so editing shows existing data.
      prefillAdmissionValues();
    }
  }

  // ── Preload saved admission custom-field values (Edit Profile) ────────────────────
  // The profile page URL is /profile/student/<studentId>; fetch that student and fill
  // the Personal Details inputs by field name. Marking the section .prefilled also
  // authorises the save hook to inject custom fields into the PUT (see send()).
  var studentCfCache = {};   // studentId -> customFields object
  var prefillInflight = {};  // studentId -> bool

  function getProfileStudentId() {
    var m = location.pathname.match(/\/profile\/student\/([a-f0-9]{24})/i);
    return m ? m[1] : null;
  }

  function applyPrefill(section, cf) {
    section.querySelectorAll('[data-cf-field]').forEach(function (group) {
      var ctrl = group.querySelector('[data-cf-name]');
      if (!ctrl) return;
      var val = cf[ctrl.getAttribute('data-cf-name')];
      if (val === undefined || val === null) return;
      var type = ctrl.getAttribute('data-cf-type');
      if (type === 'radio') {
        var r = group.querySelector('input[type=radio][value="' + String(val).replace(/"/g, '\\"') + '"]');
        if (r) r.checked = true;
      } else if (type === 'checkbox') {
        var boxes = group.querySelectorAll('input[type=checkbox]');
        if (boxes.length > 1) {
          var set = String(val).split(',').map(function (s) { return s.trim(); });
          boxes.forEach(function (b) { b.checked = set.indexOf(b.value) !== -1; });
        } else if (boxes.length === 1) {
          boxes[0].checked = !!val && String(val).toLowerCase() !== 'no';
        }
      } else {
        ctrl.value = val;
      }
    });
  }

  function prefillAdmissionValues() {
    var sid = getProfileStudentId();
    if (!sid) return;
    var section = document.getElementById(ADM_SECTION_ID);
    if (!section || !section.querySelector('[data-cf-name]')) return; // fields not rendered yet
    if (section.dataset.prefilled === sid) return;
    if (studentCfCache[sid]) {
      applyPrefill(section, studentCfCache[sid]);
      section.dataset.prefilled = sid;
      return;
    }
    if (prefillInflight[sid]) return;
    prefillInflight[sid] = true;
    fetch('/api/addmission_form/' + sid, { headers: { Authorization: getAuthHeader() } })
      .then(function (r) { return r.json(); })
      .then(function (s) { studentCfCache[sid] = (s && s.customFields) || {}; })
      .catch(function () { studentCfCache[sid] = {}; })
      .then(function () { prefillInflight[sid] = false; });
  }

  // ── Collect + validate values from a section ─────────────────────────────────────
  function collectValues(sectionId) {
    var section = document.getElementById(sectionId);
    var out = { fields: [], missing: [] };
    if (!section) return out;

    section.querySelectorAll('[data-cf-field]').forEach(function (group) {
      var ctrl = group.querySelector('[data-cf-name]');
      if (!ctrl) return;
      var name = ctrl.getAttribute('data-cf-name');
      var type = ctrl.getAttribute('data-cf-type');
      var mandatory = ctrl.getAttribute('data-cf-mandatory') === '1';
      var value = '';

      if (type === 'radio') {
        var checked = group.querySelector('input[type=radio]:checked');
        value = checked ? checked.value : '';
      } else if (type === 'checkbox') {
        var boxes = group.querySelectorAll('input[type=checkbox]');
        if (boxes.length > 1) {
          value = Array.prototype.filter.call(boxes, function (b) { return b.checked; })
            .map(function (b) { return b.value; }).join(', ');
        } else if (boxes.length === 1) {
          value = boxes[0].checked ? (boxes[0].value || 'Yes') : '';
        } else {
          value = ctrl.checked ? (ctrl.value || 'Yes') : '';
        }
      } else {
        value = (ctrl.value || '').trim();
      }

      out.fields.push({ name: name, type: type, value: value });
      var els = group.querySelectorAll('input,select,textarea');
      if (mandatory && !value) {
        out.missing.push(name);
        els.forEach(function (el) { el.classList.add('is-invalid'); });
      } else {
        els.forEach(function (el) { el.classList.remove('is-invalid'); });
      }
    });
    return out;
  }

  function valuesObject(collected) {
    var obj = {};
    collected.fields.forEach(function (f) { obj[f.name] = f.value; });
    return obj;
  }

  function activeSectionId() {
    if (document.getElementById(ENQ_SECTION_ID)) return ENQ_SECTION_ID;
    if (document.getElementById(ADM_SECTION_ID)) return ADM_SECTION_ID;
    return null;
  }

  // Block submission (capture phase, before React) when mandatory fields are empty.
  document.addEventListener('click', function (e) {
    var sectionId = activeSectionId();
    if (!sectionId) return;
    if (e.target.closest('#' + MODAL_ID)) return;
    var btn = e.target.closest('button, input[type=submit]');
    if (!btn) return;
    var label = (btn.textContent || btn.value || '').trim().toLowerCase();
    var isSubmit = btn.type === 'submit' || label === 'submit' || label === 'save' ||
      /admission|register|enroll|enquir/.test(label);
    if (!isSubmit) return;
    var res = collectValues(sectionId);
    if (res.missing.length) {
      e.preventDefault();
      e.stopImmediatePropagation();
      showToast('Please fill required field(s): ' + res.missing.join(', '), true);
    }
  }, true);

  // Inject values into the outgoing request.
  var _open = XMLHttpRequest.prototype.open;
  var _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this._cfUrl = typeof url === 'string' ? url : '';
    return _open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    var url = this._cfUrl || '';
    try {
      // Admission create: FormData POST → append a customFields JSON object.
      if (body instanceof FormData &&
          (url.indexOf('addmission_form') !== -1 || url.indexOf('addmission-form') !== -1)) {
        body.append('customFields', JSON.stringify(valuesObject(collectValues(ADM_SECTION_ID))));
      }
      // Admission edit (Edit Profile): the student update is a FormData PUT to
      // /api/students/<id>. Only inject when the Personal Details section was prefilled
      // with the student's saved values — otherwise an update from a form we never
      // populated would overwrite the stored customFields with blanks.
      else if (body instanceof FormData && /\/students\/[a-f0-9]{24}(?:[/?]|$)/i.test(url)) {
        var admSec = document.getElementById(ADM_SECTION_ID);
        if (admSec && admSec.dataset.prefilled) {
          body.append('customFields', JSON.stringify(valuesObject(collectValues(ADM_SECTION_ID))));
        }
      }
      // Enquiry: JSON string → merge fields as { fieldName: { newValue, type } }.
      else if (typeof body === 'string' && url.indexOf('submit-form/enquiry-form') !== -1) {
        var collected = collectValues(ENQ_SECTION_ID);
        if (collected.fields.length) {
          var payload = JSON.parse(body);
          collected.fields.forEach(function (f) {
            payload[f.name] = { newValue: f.value, type: f.type };
          });
          arguments[0] = JSON.stringify(payload);
          return _send.call(this, arguments[0]);
        }
      }
    } catch (e) { /* never block the original request */ }
    return _send.apply(this, arguments);
  };

  // Re-render when a relevant <select> changes (e.g. company on the admission form).
  document.addEventListener('change', function (e) {
    if (e.target && e.target.tagName === 'SELECT' &&
        !e.target.closest('#' + MODAL_ID) &&
        !e.target.closest('#' + ADM_SECTION_ID) && !e.target.closest('#' + ENQ_SECTION_ID)) {
      maybeRender();
    }
  });

  // ── Legacy "Customized Fields" builder: add a guidance bar (do NOT hide it) ───────
  // This card is the legacy custom-field builder AND the editor that opens when you
  // click the pencil next to a built-in select (Lead Source / Lead Status) to edit its
  // dropdown options. We must NOT hide it (doing so broke option editing) — instead we
  // add a slim bar above it pointing new custom fields to Settings → Custom Fields and
  // keeping the Copy Public Link shortcut. No duplicate "Customized Fields" heading.
  function hideLegacyBuilder() {
    var found = false;
    var headers = document.querySelectorAll('h3.fw-bolder');
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i];
      if (h.textContent.indexOf('Customized Fields') === -1) continue;
      var card = h.closest('.card');
      if (!card || card.id === 'cf-legacy-note' || card.closest('#' + MODAL_ID)) continue;
      found = true;

      // Custom fields are managed only via Settings → Custom Fields, so strip the
      // legacy card's per-field Edit/Delete icons and the "Add Field" button. The
      // per-select option editor (Lead Source / Lead Status pencils) opens a separate
      // modal overlay (.modal-overlay) with its own controls and is left intact.
      card.querySelectorAll('.col-lg-8 a.btn-icon, .col-lg-8 button.btn-icon').forEach(function (b) {
        var ic = (b.querySelector('i') || {}).className || '';
        if (/ki-pencil|ki-trash/.test(ic)) b.style.display = 'none';
      });
      card.querySelectorAll('button, a').forEach(function (b) {
        if (/^\s*add field\s*$/i.test(b.textContent || '')) b.style.display = 'none';
      });

      if (!document.getElementById('cf-legacy-note') && card.parentNode) {
        var note = document.createElement('div');
        note.id = 'cf-legacy-note';
        note.className = 'card mb-5 mb-xl-10';
        note.innerHTML =
          '<div class="card-body d-flex flex-wrap align-items-center justify-content-between gap-4">' +
            '<div class="text-muted">To add custom fields use <strong>Settings &rarr; Custom Fields</strong>. ' +
              'The section below edits this form’s built-in fields and dropdown options.</div>' +
            '<div class="d-flex flex-wrap gap-3">' +
              '<button type="button" id="cf-copy-link" class="btn btn-light-primary">Copy Public Link</button>' +
              '<button type="button" id="cf-open-mgr" class="btn btn-primary">Open Custom Fields</button>' +
            '</div>' +
          '</div>';
        card.parentNode.insertBefore(note, card);
        note.querySelector('#cf-open-mgr').addEventListener('click', function () { openModal(); });
        note.querySelector('#cf-copy-link').addEventListener('click', function () {
          var btn = this;
          buildPublicLink(function (link) {
            if (!link) { showToast('Open a specific form to copy its public link', true); return; }
            copyText(link).then(function () {
              showToast('Public link copied: ' + link, false);
              var orig = btn.textContent; btn.textContent = 'Copied!';
              setTimeout(function () { btn.textContent = orig; }, 1500);
            }).catch(function () { window.prompt('Copy this public enquiry link:', link); });
          });
        });
      }
    }

    // The guidance bar is injected next to a "Customized Fields" card. On SPA
    // navigation that card disappears but the injected bar would otherwise linger on
    // unrelated pages (DayBook, etc.) — so remove it whenever no such card is present.
    if (!found) {
      var stale = document.getElementById('cf-legacy-note');
      if (stale) stale.remove();
    }
  }

  // ── Boot ──────────────────────────────────────────────────────────────────────
  var observer = new MutationObserver(function () {
    injectMenu();
    hideLegacyBuilder();
    maybeRender();
  });

  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    loadCompanies();
    injectMenu();
    hideLegacyBuilder();
    maybeRender();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
