/**
 * Roll Number Format addon.
 *
 * 1) Settings — injects a "Roll Number Format" card on the General Settings page
 *    (/general-settings) where an admin sets a custom prefix (e.g. "OSC").
 *    New admissions are then numbered  PREFIX/FY-START-YEAR/NUMBER  (e.g. OSC/2026/1312),
 *    the year being the Indian financial year that starts on 1 April.
 *    Reads/saves via GET|POST /api/rollnumber-format.
 *
 * 2) Display — the student profile renders Roll Number in an <input type="number">,
 *    which cannot show a formatted string ("OSC/2026/1312"). This addon converts that
 *    field to type=text and injects the formatted value captured from the
 *    GET /api/addmission_form/:id response, so the new format displays correctly.
 *    Existing plain-number roll numbers are unaffected.
 */
(function () {
  'use strict';

  var CARD_ID = 'rnf-settings-card';
  var CONVERTED_FLAG = 'data-rnf-text';

  // ── Auth helper (same scheme as logo-customizer) ──────────────────────────────
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

  /** Indian financial-year start year for a date (FY begins 1 April). */
  function fyStartYear(date) {
    return date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  }

  /** Mirror of the backend formatRollNumber, for the live preview. */
  function previewRoll(prefix) {
    var clean = (prefix || '').trim();
    if (!clean) return '1312';
    return clean + '/' + fyStartYear(new Date()) + '/1312';
  }

  function showToast(msg, isError) {
    var id = 'rnf-toast';
    var existing = document.getElementById(id);
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = id;
    toast.textContent = msg;
    toast.style.cssText = [
      'position:fixed', 'bottom:24px', 'right:24px', 'z-index:99999',
      'padding:12px 20px', 'border-radius:8px', 'font-size:14px',
      'font-weight:600', 'color:#fff', 'box-shadow:0 4px 16px rgba(0,0,0,.3)',
      'transition:opacity .4s', isError ? 'background:#dc3545' : 'background:#198754',
    ].join(';');
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 500);
    }, 3000);
  }

  // ── 1. Settings card ──────────────────────────────────────────────────────────
  function onGeneralSettings() {
    var loc = (location.pathname + location.hash).toLowerCase();
    return loc.indexOf('general-settings') !== -1;
  }

  function buildCard() {
    var card = document.createElement('div');
    card.id = CARD_ID;
    card.className = 'card mb-5 mb-xl-10';
    card.innerHTML =
      '<div class="card-header border-0 pt-6">' +
        '<div class="card-title m-0"><h3 class="fw-bold m-0">Roll Number Format</h3></div>' +
      '</div>' +
      '<div class="card-body pt-2 pb-6">' +
        '<p class="text-muted fs-6 mb-6">Add a custom prefix to student roll numbers. New admissions are numbered as ' +
          '<strong>PREFIX&nbsp;/&nbsp;YEAR&nbsp;/&nbsp;NUMBER</strong> &mdash; the year is the financial year starting 1&nbsp;April. ' +
          'Leave the prefix empty to keep plain numbers.</p>' +
        '<label class="form-label fw-bold fs-6 d-block mb-2">Roll Number Prefix</label>' +
        '<input id="rnf-prefix" type="text" maxlength="20" autocomplete="off" ' +
          'class="form-control form-control-lg form-control-solid" placeholder="e.g. OSC" ' +
          'style="max-width:340px;" />' +
        '<div class="form-text mt-2 mb-6">Preview: <span id="rnf-preview" class="fw-bold text-gray-800">1312</span></div>' +
        '<button id="rnf-save" type="button" class="btn btn-primary">Save Changes</button>' +
      '</div>';
    return card;
  }

  function wireCard(card) {
    var input = card.querySelector('#rnf-prefix');
    var preview = card.querySelector('#rnf-preview');
    var saveBtn = card.querySelector('#rnf-save');

    function refreshPreview() {
      preview.textContent = previewRoll(input.value);
    }
    input.addEventListener('input', refreshPreview);

    // Load current value
    fetch('/api/rollnumber-format', { headers: { Authorization: getAuthHeader() } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        input.value = (d && d.prefix) || '';
        refreshPreview();
      })
      .catch(function () { /* leave empty */ });

    saveBtn.addEventListener('click', function () {
      saveBtn.disabled = true;
      var original = saveBtn.textContent;
      saveBtn.textContent = 'Saving…';
      fetch('/api/rollnumber-format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: getAuthHeader() },
        body: JSON.stringify({ prefix: input.value }),
      })
        .then(function (r) { return r.json().then(function (b) { return { ok: r.ok, b: b }; }); })
        .then(function (res) {
          if (res.ok) {
            input.value = (res.b && res.b.prefix) || '';
            refreshPreview();
            showToast('Roll number format saved', false);
          } else {
            showToast((res.b && res.b.error) || 'Save failed', true);
          }
        })
        .catch(function () { showToast('Network error while saving', true); })
        .finally(function () {
          saveBtn.disabled = false;
          saveBtn.textContent = original;
        });
    });
  }

  function injectCard() {
    if (!onGeneralSettings()) return;
    if (document.getElementById(CARD_ID)) return;
    var container =
      document.querySelector('#kt_app_content_container') ||
      document.querySelector('#kt_app_content') ||
      document.querySelector('#root');
    if (!container) return;
    // The settings page wraps its cards in a top-level vertical flex column
    // (d-flex flex-column gap-10) whose children stretch full width. Append there
    // when present so the card lines up with the others; otherwise to the container.
    var column = container.querySelector(':scope > .d-flex.flex-column') || container;
    var card = buildCard();
    column.appendChild(card);
    wireCard(card);
  }

  // ── 2. Profile roll-number field display ──────────────────────────────────────
  var lastRoll = { value: '', at: 0 };

  function captureRollFromJson(text) {
    if (!text || text.indexOf('rollNumber') === -1) return;
    try {
      var data = JSON.parse(text);
      var rec = Array.isArray(data) ? null : data;
      var roll = rec && (rec.rollNumber || (rec.data && rec.data.rollNumber));
      if (typeof roll === 'string' && roll.indexOf('/') !== -1) {
        lastRoll = { value: roll, at: Date.now() };
        // Apply shortly after, once React has rendered the field.
        setTimeout(fixRollInputs, 50);
        setTimeout(fixRollInputs, 400);
      }
    } catch (e) { /* not JSON we care about */ }
  }

  /** Set a React-controlled input's value so React keeps it on re-render. */
  function setReactInputValue(input, value) {
    try {
      var setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      ).set;
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (e) {
      input.value = value;
    }
  }

  function rollInputs() {
    var labels = document.querySelectorAll('label');
    var out = [];
    labels.forEach(function (lbl) {
      if (lbl.textContent.trim().toLowerCase().indexOf('roll number') !== 0) return;
      var row = lbl.closest('.row') || lbl.parentElement;
      if (!row) return;
      var inp = row.querySelector('input');
      if (inp) out.push(inp);
    });
    return out;
  }

  function fixRollInputs() {
    rollInputs().forEach(function (inp) {
      // Convert to text once. React diffs against its own vdom (type prop is constant
      // "number"), so it never rewrites the attribute after this — the change sticks.
      if (inp.getAttribute('type') === 'number') {
        inp.setAttribute('type', 'text');
        inp.setAttribute(CONVERTED_FLAG, '1');
      }
      // Inject the formatted value only when we just loaded a profile whose roll number
      // is in the new slash format and the field is empty (number input rejected it).
      var fresh = Date.now() - lastRoll.at < 8000;
      if (fresh && lastRoll.value && !inp.value) {
        setReactInputValue(inp, lastRoll.value);
      }
    });
  }

  // ── Response interception (XHR + fetch) for /addmission_form/:id ──────────────
  var _open = XMLHttpRequest.prototype.open;
  var _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this._rnfUrl = typeof url === 'string' ? url : '';
    return _open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    var self = this;
    if (self._rnfUrl && self._rnfUrl.indexOf('addmission_form/') !== -1) {
      self.addEventListener('load', function () {
        try { captureRollFromJson(self.responseText); } catch (e) { /* ignore */ }
      });
    }
    return _send.apply(this, arguments);
  };

  if (window.fetch) {
    var _fetch = window.fetch;
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var p = _fetch.apply(this, arguments);
      if (url && url.indexOf('addmission_form/') !== -1) {
        p.then(function (resp) {
          try { resp.clone().text().then(captureRollFromJson); } catch (e) { /* ignore */ }
          return resp;
        }).catch(function () { /* ignore */ });
      }
      return p;
    };
  }

  // ── Boot ──────────────────────────────────────────────────────────────────────
  var observer = new MutationObserver(function () {
    injectCard();
    fixRollInputs();
  });

  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    injectCard();
    fixRollInputs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
