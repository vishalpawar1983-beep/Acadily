/**
 * Database Backup addon.
 *
 * Adds a "Database Backup" item to the Settings sidebar menu that opens a panel listing
 * the available per-company backups (last 3 days x each company) with Download buttons.
 * Data comes from GET /api/backups; downloads stream from GET /api/backups/file (the file
 * is fetched with the auth header and saved as a blob, so the token isn't put in the URL).
 */
(function () {
  'use strict';

  var MENU_ID = 'bk-menu-item';
  var MODAL_ID = 'bk-modal';

  function getAuthHeader() {
    try {
      var keys = Object.keys(localStorage);
      for (var i = 0; i < keys.length; i++) {
        var v = localStorage.getItem(keys[i]);
        if (v && v.indexOf('api_token') !== -1) {
          try { var p = JSON.parse(v); var t = p.api_token || p.token || p.accessToken; if (t) return 'Bearer ' + t; } catch (e) { /* skip */ }
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
  function fmtSize(b) {
    if (!b) return '';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  }
  function fmtDate(d) {
    var p = d.split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : d;
  }

  function ensureModal() {
    if (document.getElementById(MODAL_ID)) return document.getElementById(MODAL_ID);
    var ov = document.createElement('div');
    ov.id = MODAL_ID;
    ov.style.cssText = ['position:fixed', 'inset:0', 'z-index:100000', 'display:none', 'align-items:flex-start',
      'justify-content:center', 'background:rgba(0,0,0,.5)', 'overflow:auto', 'padding:40px 16px'].join(';');
    ov.innerHTML =
      '<div class="card" style="width:100%;max-width:880px;box-shadow:0 10px 40px rgba(0,0,0,.3);">' +
        '<div class="card-header d-flex align-items-center justify-content-between">' +
          '<h3 class="fw-bold m-0">Database Backup</h3>' +
          '<button type="button" id="bk-close" class="btn btn-sm btn-icon btn-light">&times;</button>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="text-muted mb-4">Automatic daily backup of each company’s data (last 3 days kept). ' +
            'Click a date to download that company’s backup for that day.</div>' +
          '<div id="bk-body" class="table-responsive">Loading…</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.style.display = 'none'; });
    ov.querySelector('#bk-close').addEventListener('click', function () { ov.style.display = 'none'; });
    return ov;
  }

  function openModal() { ensureModal().style.display = 'flex'; loadBackups(); }

  function loadBackups() {
    var body = document.getElementById('bk-body');
    if (!body) return;
    body.innerHTML = 'Loading…';
    fetch('/api/backups', { headers: { Authorization: getAuthHeader() } })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var rows = (res && res.backups) || [];
        if (!rows.length) {
          body.innerHTML = '<div class="text-muted">No backups available yet. The first one runs tonight.</div>';
          return;
        }
        var dates = [];
        var companies = {};
        rows.forEach(function (b) {
          if (dates.indexOf(b.date) === -1) dates.push(b.date);
          companies[b.companyId] = b.companyName || b.companyId;
        });
        dates.sort().reverse();
        var byKey = {};
        rows.forEach(function (b) { byKey[b.date + '|' + b.companyId] = b; });

        var html = '<table class="table table-row-bordered align-middle gy-3">' +
          '<thead><tr class="fw-bold fs-7 text-gray-600 text-uppercase"><th>Company</th>' +
          dates.map(function (d) { return '<th class="text-center">' + esc(fmtDate(d)) + '</th>'; }).join('') +
          '</tr></thead><tbody>';
        Object.keys(companies).forEach(function (cid) {
          html += '<tr><td class="fw-bold">' + esc(companies[cid]) + '</td>';
          dates.forEach(function (d) {
            var b = byKey[d + '|' + cid];
            if (b) {
              html += '<td class="text-center"><button type="button" class="btn btn-sm btn-light-primary bk-dl" ' +
                'data-date="' + esc(d) + '" data-cid="' + esc(cid) + '" data-name="' + esc(companies[cid]) + '">' +
                'Download <span class="text-muted fw-normal">(' + fmtSize(b.sizeBytes) + ')</span></button></td>';
            } else {
              html += '<td class="text-center text-muted">—</td>';
            }
          });
          html += '</tr>';
        });
        html += '</tbody></table>';
        body.innerHTML = html;

        body.querySelectorAll('.bk-dl').forEach(function (btn) {
          btn.addEventListener('click', function () { download(btn.dataset.date, btn.dataset.cid, btn.dataset.name, btn); });
        });
      })
      .catch(function () { body.innerHTML = '<div class="text-danger">Could not load backups.</div>'; });
  }

  function download(date, cid, name, btn) {
    var orig = btn.innerHTML;
    btn.disabled = true; btn.textContent = 'Downloading…';
    fetch('/api/backups/file?date=' + encodeURIComponent(date) + '&companyId=' + encodeURIComponent(cid),
      { headers: { Authorization: getAuthHeader() } })
      .then(function (r) { if (!r.ok) throw new Error('failed'); return r.blob(); })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = (String(name).replace(/[^a-z0-9]+/gi, '-').toLowerCase() || cid) + '-' + date + '.json.gz';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        btn.disabled = false; btn.innerHTML = orig;
      })
      .catch(function () { btn.disabled = false; btn.innerHTML = orig; alert('Download failed.'); });
  }

  function injectMenu() {
    if (document.getElementById(MENU_ID)) return;
    var anchor =
      document.querySelector('a.menu-link[href="/general-settings"]') ||
      document.querySelector('a.menu-link[href="/email-settings"]') ||
      document.querySelector('a.menu-link[href="/auth-settings"]');
    if (!anchor) return;
    var item = anchor.closest('.menu-item');
    if (!item || !item.parentNode) return;
    var clone = item.cloneNode(true);
    clone.id = MENU_ID;
    var link = clone.querySelector('a.menu-link');
    if (link) { link.setAttribute('href', '#'); link.classList.remove('active'); }
    var title = clone.querySelector('.menu-title');
    if (title) title.textContent = 'Database Backup';
    var badge = clone.querySelector('.menu-badge, .badge');
    if (badge) badge.remove();
    clone.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openModal(); });
    item.parentNode.insertBefore(clone, item.nextSibling);
  }

  var observer = new MutationObserver(function () { injectMenu(); });
  function start() { observer.observe(document.body, { childList: true, subtree: true }); injectMenu(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
