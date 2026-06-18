/**
 * Referral addon — DayBook Commission accounts double as "referrers".
 *
 * On the Add/Edit DayBook Account pages, when Account Type = "Commission" this injects
 * an Email field (cloned from the Account Name field so it matches the form styling),
 * prefills it on edit, and appends `email` to the save request (POST /api/dayBook/addAccount
 * or PUT /api/dayBook/<id>). The email is used by the server to notify the referrer when
 * they're chosen in an enquiry form's "Referred By" field. The "Referred By" select itself
 * is injected server-side, so it isn't handled here.
 */
(function () {
  'use strict';

  var FIELD_ID = 'ref-email-input';
  var WRAP_ATTR = 'data-ref-email-wrap';
  var prefilled = {};

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

  function accountFormCtx() {
    var m = location.pathname.match(/\/daybook\/(addAccount|editAccount)\/([a-f0-9]{24})/i);
    if (!m) return null;
    var nameInp = document.querySelector('input[name="accountName"]');
    var typeSel = document.querySelector('select[name="accountType"]');
    if (!nameInp || !typeSel) return null;
    return { mode: m[1], id: m[2], nameInp: nameInp, typeSel: typeSel };
  }

  function column(el) {
    return el.closest('.col-md-6') || el.closest('[class*="col-"]') || el.parentElement;
  }

  function ensureEmailField(ctx) {
    var isCommission = ctx.typeSel.value === 'Commission';
    var wrap = document.querySelector('[' + WRAP_ATTR + ']');

    if (!isCommission) { if (wrap) wrap.style.display = 'none'; return; }

    if (!wrap) {
      var nameCol = column(ctx.nameInp);
      wrap = nameCol.cloneNode(true);
      wrap.setAttribute(WRAP_ATTR, '1');
      wrap.style.display = '';
      var inp = wrap.querySelector('input');
      if (inp) {
        inp.id = FIELD_ID; inp.name = 'refEmail'; inp.type = 'email';
        inp.value = ''; inp.placeholder = 'Enter Email..';
        inp.removeAttribute('required');
      }
      var lbl = wrap.querySelector('label');
      if (lbl) lbl.textContent = 'Email (for referral notifications)';
      // strip any cloned validation error text
      wrap.querySelectorAll('.text-danger, .invalid-feedback, .error, .text-red-500').forEach(function (e) { e.remove(); });
      var typeCol = column(ctx.typeSel);
      typeCol.parentNode.insertBefore(wrap, typeCol.nextSibling);
    } else {
      wrap.style.display = '';
    }

    // Prefill the email on the edit page from the saved account.
    if (ctx.mode === 'editAccount' && !prefilled[ctx.id]) {
      prefilled[ctx.id] = true;
      fetch('/api/dayBook', { headers: { Authorization: 'Bearer ' + getToken() } })
        .then(function (r) { return r.json(); })
        .then(function (list) {
          var acct = (Array.isArray(list) ? list : []).find(function (a) { return String(a._id) === ctx.id; });
          var inp = document.getElementById(FIELD_ID);
          if (acct && acct.email && inp && !inp.value) inp.value = acct.email;
        })
        .catch(function () { prefilled[ctx.id] = false; });
    }
  }

  // Append `email` to the account create/update request.
  var _open = XMLHttpRequest.prototype.open;
  var _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this._refUrl = typeof url === 'string' ? url : '';
    this._refMethod = (method || '').toUpperCase();
    return _open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    try {
      var u = this._refUrl || '';
      var isAdd = /\/dayBook\/addAccount/i.test(u);
      var isEdit = /\/dayBook\/[a-f0-9]{24}(?:[/?]|$)/i.test(u) && this._refMethod === 'PUT';
      if ((isAdd || isEdit) && typeof body === 'string') {
        var inp = document.getElementById(FIELD_ID);
        var wrap = document.querySelector('[' + WRAP_ATTR + ']');
        var visible = wrap && wrap.style.display !== 'none';
        if (inp && visible) {
          var payload = JSON.parse(body);
          payload.email = inp.value || '';
          arguments[0] = JSON.stringify(payload);
          return _send.call(this, arguments[0]);
        }
      }
    } catch (e) { /* never block the request */ }
    return _send.apply(this, arguments);
  };

  var observer = new MutationObserver(function () {
    var ctx = accountFormCtx();
    if (ctx) ensureEmailField(ctx);
  });

  function start() {
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'accountType') {
        var ctx = accountFormCtx();
        if (ctx) ensureEmailField(ctx);
      }
    });
    var ctx = accountFormCtx();
    if (ctx) ensureEmailField(ctx);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
