/**
 * Logo Customizer — sidebar logo click-to-change for any company.
 *
 * When a logged-in (non-Student) user hovers over the sidebar logo, a small
 * "Change Logo" overlay appears.  Clicking it opens a file picker; the chosen
 * image is uploaded to PUT /api/company/:id and the sidebar updates immediately
 * without a page reload.
 *
 * Works for ALL companies / tenants — each upload is scoped to the user's own
 * company so other tenants are never affected.
 */
(function () {
  'use strict';

  var OVERLAY_ID    = 'logo-change-overlay';
  var INPUT_ID      = 'logo-change-file-input';
  var TOAST_ID      = 'logo-change-toast';
  var INJECTED_FLAG = 'data-logo-customizer';

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function getAuthHeader() {
    try {
      // auth token is stored in localStorage by the React app
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
        // React Query / Auth store may store it as a plain token string
        if (val && val.length > 20 && val.indexOf('.') !== -1 && keys[i].toLowerCase().indexOf('token') !== -1) {
          return 'Bearer ' + val;
        }
      }
    } catch (e) { /* ignore */ }
    return '';
  }

  function getCompanyId() {
    try {
      var keys = Object.keys(localStorage);
      // The company ID is often in the auth state or company context
      for (var i = 0; i < keys.length; i++) {
        var val = localStorage.getItem(keys[i]);
        if (!val) continue;
        try {
          var obj = JSON.parse(val);
          if (obj && obj.companyId) return String(obj.companyId);
          if (obj && obj.data && obj.data.companyId) return String(obj.data.companyId);
        } catch (e) { /* skip */ }
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function showToast(msg, isError) {
    var existing = document.getElementById(TOAST_ID);
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = TOAST_ID;
    toast.textContent = msg;
    toast.style.cssText = [
      'position:fixed', 'bottom:24px', 'right:24px', 'z-index:99999',
      'padding:12px 20px', 'border-radius:8px', 'font-size:14px',
      'font-weight:600', 'color:#fff', 'box-shadow:0 4px 16px rgba(0,0,0,.3)',
      'transition:opacity .4s',
      isError ? 'background:#dc3545' : 'background:#198754',
    ].join(';');
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 500);
    }, 3000);
  }

  // ── Upload handler ───────────────────────────────────────────────────────────

  function uploadLogo(file, companyId, companyData) {
    if (!file) return;
    var allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (allowed.indexOf(file.type) === -1) {
      showToast('Only PNG, JPG, JPEG, WebP or SVG images are allowed', true);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be under 2 MB', true);
      return;
    }

    showToast('Uploading logo…', false);

    var cd = companyData || {};
    var formData = new FormData();
    formData.append('id', companyId);
    formData.append('logo', file);
    // Pass existing company fields so the PUT handler keeps them intact
    formData.append('companyName',    cd.companyName    || '');
    formData.append('email',          cd.email          || '');
    formData.append('companyPhone',   cd.companyPhone   || '');
    formData.append('companyWebsite', cd.companyWebsite || '');
    formData.append('companyAddress', cd.companyAddress || '');
    formData.append('reciptNumber',   cd.reciptNumber   || '');
    formData.append('isGstBased',     cd.isGstBased     || 'No');
    formData.append('gst',            cd.gst            || '');

    var xhr = new XMLHttpRequest();
    xhr.open('PUT', '/api/company/' + companyId, true);
    var auth = getAuthHeader();
    if (auth) xhr.setRequestHeader('Authorization', auth);

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        showToast('Logo updated successfully!', false);
        // Update the sidebar img element immediately
        var newUrl = '/api/images/' + file.name.replace(/\s+/g, '-');
        try {
          var resp = JSON.parse(xhr.responseText);
          if (resp.logo) newUrl = '/api/images/' + resp.logo;
        } catch (e) { /* ignore */ }
        var logoImgs = document.querySelectorAll('#kt_app_sidebar_logo img');
        var objectURL = URL.createObjectURL(file);
        logoImgs.forEach(function (img) {
          img.src = objectURL;
        });
        // Invalidate React Query cache so next navigation picks up the new logo
        try {
          var qc = window.__reactQueryClient;
          if (qc) qc.invalidateQueries({ queryKey: ['getCompanyLists'] });
        } catch (e) { /* ignore */ }
      } else {
        try {
          var errBody = JSON.parse(xhr.responseText);
          showToast('Upload failed: ' + (errBody.message || xhr.status), true);
        } catch (e) {
          showToast('Upload failed (status ' + xhr.status + ')', true);
        }
      }
    };
    xhr.onerror = function () { showToast('Network error during upload', true); };
    xhr.send(formData);
  }

  /** Read company data from the React Query in-memory cache */
  function getCompanyDataFromReactQuery() {
    try {
      var cache = window.__reactQueryCache;
      if (cache) {
        var queries = cache.getAll ? cache.getAll() : [];
        for (var i = 0; i < queries.length; i++) {
          var q = queries[i];
          if (q && q.queryKey && q.queryKey[0] === 'getCompanyLists' && q.state && q.state.data) {
            var arr = q.state.data;
            if (Array.isArray(arr) && arr[0]) return arr[0];
          }
        }
      }
    } catch (e) { /* ignore */ }
    // Fallback: parse from DOM / document title
    return {};
  }

  // ── Build and inject the overlay ─────────────────────────────────────────────

  function injectLogoChanger() {
    var container = document.getElementById('kt_app_sidebar_logo');
    if (!container || container.getAttribute(INJECTED_FLAG)) return;

    container.setAttribute(INJECTED_FLAG, '1');
    container.style.position = 'relative';

    // Hidden file input
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = INPUT_ID;
    fileInput.accept = 'image/png,image/jpeg,image/jpg,image/webp,image/svg+xml';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Overlay button (shows on hover)
    var overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
          '<polyline points="17 8 12 3 7 8"/>' +
          '<line x1="12" y1="3" x2="12" y2="15"/>' +
        '</svg>' +
        '<span style="font-size:10px;font-weight:700;letter-spacing:.4px;">CHANGE</span>' +
      '</div>';

    overlay.style.cssText = [
      'position:absolute', 'inset:0', 'z-index:10',
      'display:flex', 'align-items:center', 'justify-content:center',
      'background:rgba(0,0,0,.6)', 'border-radius:6px',
      'cursor:pointer', 'opacity:0',
      'transition:opacity .25s',
      'color:#fff',
    ].join(';');

    container.appendChild(overlay);

    // Show/hide on hover
    container.addEventListener('mouseenter', function () {
      overlay.style.opacity = '1';
    });
    container.addEventListener('mouseleave', function () {
      overlay.style.opacity = '0';
    });

    // Click → resolve company then open file picker
    overlay.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      // Always fetch fresh company list so we have the current companyId
      fetch('/api/company', { headers: { Authorization: getAuthHeader() } })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (Array.isArray(data) && data.length > 0) {
            // Store ALL company data for upload; use the first company
            var company = data[0];
            fileInput.dataset.companyId    = company._id;
            fileInput.dataset.companyData  = JSON.stringify(company);
            fileInput.click();
          } else {
            showToast('No company found. Use Manage Company → Edit to change the logo.', true);
          }
        })
        .catch(function () {
          showToast('Failed to load company data. Try Manage Company → Edit.', true);
        });
    });

    // Handle file selection
    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      var cId = fileInput.dataset.companyId;
      if (!cId) {
        showToast('Company ID not found. Use Manage Company → Edit instead.', true);
        fileInput.value = '';
        return;
      }
      // Restore company data for the upload
      try {
        var saved = JSON.parse(fileInput.dataset.companyData || '{}');
        uploadLogo(file, cId, saved);
      } catch (e) {
        uploadLogo(file, cId, {});
      }
      fileInput.value = ''; // reset so same file can be re-selected
    });
  }

  // ── Watch for sidebar rendering ───────────────────────────────────────────────

  var observer = new MutationObserver(function () { injectLogoChanger(); });

  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    injectLogoChanger();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
