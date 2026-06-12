/**
 * Personal Details / More Options addon for the Admission Form.
 *
 * Injects a collapsible "Personal Details" section before the "Qualification"
 * section of the admission form.
 *
 * Each document (Passport, Aadhar Card, PAN Card) has Yes / No radio buttons:
 *   • Yes  → shows a text input to enter the document number
 *   • No   → shows a status select (Not Applied / Applied / In Progress)
 *
 * Medical History is a free-text textarea.
 *
 * On form submission the values are injected into the FormData via XHR interception.
 */
(function () {
  'use strict';

  // ── 1. XHR interceptor ──────────────────────────────────────────────────────
  var _origOpen = XMLHttpRequest.prototype.open;
  var _origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._pdUrl = typeof url === 'string' ? url : '';
    return _origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (
      body instanceof FormData &&
      this._pdUrl &&
      (this._pdUrl.includes('addmission_form') || this._pdUrl.includes('addmission-form'))
    ) {
      var docs = ['passport', 'aadhar', 'pan'];
      docs.forEach(function (doc) {
        var yesRadio = document.getElementById('pd-' + doc + '-yes');
        if (!yesRadio) return;
        if (yesRadio.checked) {
          // Has the document — send the number
          var numEl = document.getElementById('pd-' + doc + 'No');
          body.append(doc + 'No', numEl ? numEl.value.trim() : '');
          body.append(doc + 'Status', 'available');
        } else {
          // Doesn't have the document — send the status
          var statusEl = document.getElementById('pd-' + doc + 'Status');
          body.append(doc + 'No', '');
          body.append(doc + 'Status', statusEl ? statusEl.value : 'not_applied');
        }
      });
      // Medical history
      var medEl = document.getElementById('pd-medicalHistory');
      if (medEl && medEl.value.trim()) {
        body.append('medicalHistory', medEl.value.trim());
      }
    }
    return _origSend.apply(this, arguments);
  };

  // ── 2. Build section HTML ────────────────────────────────────────────────────
  var SECTION_ID = 'pd-personal-details-wrapper';

  var STATUS_OPTIONS =
    '<option value="not_applied">Not Applied</option>' +
    '<option value="applied">Applied</option>' +
    '<option value="in_progress">In Progress</option>';

  /**
   * Builds one document row: label + Yes/No radios + conditional input/select.
   * @param {string} key      e.g. "passport"
   * @param {string} label    e.g. "Passport"
   * @param {string} hint     placeholder for the number input
   * @param {number} maxlen   maxlength for the number input
   */
  function docRow(key, label, hint, maxlen) {
    return (
      '<div class="pd-doc-row mb-5" id="pd-row-' + key + '">' +
        '<div class="d-flex align-items-center gap-4 mb-2">' +
          '<label class="fw-bold fs-6 mb-0" style="min-width:130px;">' + label + '</label>' +

          // Yes radio
          '<div class="form-check form-check-inline">' +
            '<input class="form-check-input" type="radio" name="pd-' + key + '" id="pd-' + key + '-yes" value="yes" />' +
            '<label class="form-check-label fw-semibold text-success" for="pd-' + key + '-yes">Yes</label>' +
          '</div>' +

          // No radio
          '<div class="form-check form-check-inline">' +
            '<input class="form-check-input" type="radio" name="pd-' + key + '" id="pd-' + key + '-no" value="no" checked />' +
            '<label class="form-check-label fw-semibold text-danger" for="pd-' + key + '-no">No</label>' +
          '</div>' +
        '</div>' +

        // Number input (shown when Yes)
        '<input type="text" id="pd-' + key + 'No"' +
          ' class="form-control form-control-lg form-control-solid pd-num-input"' +
          ' placeholder="' + hint + '"' +
          (maxlen ? ' maxlength="' + maxlen + '"' : '') +
          ' style="display:none;" />' +

        // Status select (shown when No)
        '<select id="pd-' + key + 'Status"' +
          ' class="form-select form-select-solid pd-status-select">' +
          STATUS_OPTIONS +
        '</select>' +

      '</div>'
    );
  }

  function buildSection() {
    var wrapper = document.createElement('div');
    wrapper.id = SECTION_ID;
    wrapper.style.marginBottom = '8px';

    wrapper.innerHTML =
      // ── Toggle checkbox ──
      '<div class="row mt-4 mb-2">' +
        '<div class="col-12">' +
          '<div class="form-check d-flex align-items-center gap-2">' +
            '<input class="form-check-input" type="checkbox" id="pd-toggle"' +
              ' style="width:20px;height:20px;cursor:pointer;" />' +
            '<label class="form-check-label fw-bold fs-5 ms-2" for="pd-toggle"' +
              ' style="cursor:pointer;">Personal Details / More Options</label>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // ── Collapsible fields ──
      '<div id="pd-fields-container" style="display:none;">' +
        '<div class="card border border-dashed border-gray-400 p-6 mb-4">' +
          '<div class="row">' +

            '<div class="col-12 col-md-6">' +
              docRow('passport', 'Passport',   'Enter Passport Number', 20) +
            '</div>' +

            '<div class="col-12 col-md-6">' +
              docRow('aadhar', 'Aadhar Card',  'Enter 12-digit Aadhar Number', 12) +
            '</div>' +

            '<div class="col-12 col-md-6">' +
              docRow('pan', 'PAN Card',        'Enter PAN Number (e.g. ABCDE1234F)', 10) +
            '</div>' +

            // Medical history spans full width
            '<div class="col-12 mt-3">' +
              '<label class="fw-bold fs-6 mb-2 d-block">Any Medical History</label>' +
              '<textarea id="pd-medicalHistory"' +
                ' class="form-control form-control-lg form-control-solid"' +
                ' rows="3"' +
                ' placeholder="Enter any medical history, conditions, allergies or special requirements...">' +
              '</textarea>' +
            '</div>' +

          '</div>' +
        '</div>' +
      '</div>';

    // ── Wire checkbox toggle ──────────────────────────────────────────
    var toggle = wrapper.querySelector('#pd-toggle');
    var fieldsContainer = wrapper.querySelector('#pd-fields-container');
    toggle.addEventListener('change', function () {
      fieldsContainer.style.display = this.checked ? 'block' : 'none';
    });

    // ── Wire Yes / No radios for each document ────────────────────────
    ['passport', 'aadhar', 'pan'].forEach(function (key) {
      var yesRadio    = wrapper.querySelector('#pd-' + key + '-yes');
      var noRadio     = wrapper.querySelector('#pd-' + key + '-no');
      var numInput    = wrapper.querySelector('#pd-' + key + 'No');
      var statusSel   = wrapper.querySelector('#pd-' + key + 'Status');

      function update() {
        if (yesRadio.checked) {
          numInput.style.display   = 'block';
          statusSel.style.display  = 'none';
        } else {
          numInput.style.display   = 'none';
          statusSel.style.display  = 'block';
        }
      }

      yesRadio.addEventListener('change', update);
      noRadio.addEventListener('change', update);
      update(); // initial state — No is checked by default
    });

    // ── Force PAN input uppercase ─────────────────────────────────────
    var panInput = wrapper.querySelector('#pd-panNo');
    if (panInput) {
      panInput.addEventListener('input', function () {
        var pos = this.selectionStart;
        this.value = this.value.toUpperCase();
        this.setSelectionRange(pos, pos);
      });
    }

    return wrapper;
  }

  // ── 3. Inject into the DOM ───────────────────────────────────────────────────
  function tryInject() {
    if (document.getElementById(SECTION_ID)) return;

    var headers = document.querySelectorAll('.card-header h3.fw-bolder');
    var qualHeader = null;
    for (var i = 0; i < headers.length; i++) {
      if (headers[i].textContent.trim() === 'Qualification') {
        qualHeader = headers[i];
        break;
      }
    }
    if (!qualHeader) return;

    var qualRow = qualHeader.closest('.row');
    if (!qualRow || !qualRow.parentNode) return;

    qualRow.parentNode.insertBefore(buildSection(), qualRow);
  }

  // ── 4. Watch for React rendering ────────────────────────────────────────────
  var observer = new MutationObserver(function () { tryInject(); });

  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    tryInject();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
