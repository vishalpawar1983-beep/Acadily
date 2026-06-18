/**
 * Referral addon — DayBook Commission accounts double as "referrers".
 *
 * On the Add/Edit DayBook Account pages, when Account Type = "Commission" this injects
 * an Email field (cloned from the Account Name field so it matches the form styling),
 * prefills it on edit, and appends `email` to the save request (POST /api/dayBook/addAccount
 * or PUT /api/dayBook/<id>). The email is used by the server to notify the referrer when
 * they're chosen in an enquiry form's "Referred By" field. The "Referred By" select itself
 * is injected server-side, so it isn't handled here.
 *
 * The typed/loaded email is mirrored into a module variable (`emailValue`) so it survives
 * React re-renders that may recreate the injected field, and the save-hook reads THAT
 * variable (not the live DOM) — robust against the field being momentarily cleared.
 */
(function () {
  'use strict';

  var FIELD_ID = 'ref-email-input';
  var WRAP_ATTR = 'data-ref-email-wrap';
  var emailValue = '';      // current email text (survives field recreation)
  var boundId = null;       // account id the current emailValue belongs to
  var prefilledIds = {};    // account ids already prefilled from the server

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

  function toast(msg, isErr) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = ['position:fixed', 'bottom:24px', 'right:24px', 'z-index:100002', 'padding:10px 18px',
      'border-radius:8px', 'font-weight:600', 'font-size:13px', 'color:#fff', 'box-shadow:0 4px 16px rgba(0,0,0,.3)',
      isErr ? 'background:#dc3545' : 'background:#198754'].join(';');
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2400);
  }

  var lastSaved = {};
  function saveEmailDirect(id, email) {
    if (lastSaved[id] === email) return; // avoid redundant saves
    lastSaved[id] = email;
    fetch('/api/dayBook/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
      body: JSON.stringify({ email: email }),
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (b) { return { ok: r.ok, b: b }; }); })
      .then(function (x) { if (x.ok) toast('Email saved', false); else { lastSaved[id] = undefined; toast('Could not save email', true); } })
      .catch(function () { lastSaved[id] = undefined; toast('Could not save email', true); });
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

  // Replace the field label, which here is a TEXT NODE directly inside the cloned
  // <label> (e.g. "Account Name "), not a child element. Walk text nodes and rename
  // the first non-empty one.
  function relabel(root, text) {
    var stack = [root];
    while (stack.length) {
      var n = stack.shift();
      for (var i = 0; i < n.childNodes.length; i++) {
        var c = n.childNodes[i];
        if (c.nodeType === 3 && c.textContent.trim()) { c.textContent = text + ' '; return true; }
        if (c.nodeType === 1 && c.tagName !== 'INPUT' && c.tagName !== 'SELECT') stack.push(c);
      }
    }
    return false;
  }

  function buildField(ctx) {
    var nameCol = column(ctx.nameInp);
    var wrap = nameCol.cloneNode(true);
    wrap.setAttribute(WRAP_ATTR, '1');
    wrap.style.display = '';
    // turn the cloned input into the email input (clear the cloned value attr too)
    var inp = wrap.querySelector('input');
    if (inp) {
      inp.id = FIELD_ID; inp.name = 'refEmail'; inp.type = 'email';
      inp.removeAttribute('value'); inp.value = '';
      inp.placeholder = 'Enter Email..';
      inp.removeAttribute('required'); inp.setAttribute('autocomplete', 'off');
      inp.addEventListener('input', function () { emailValue = inp.value; });
      // On the EDIT page, persist the email directly the moment the field loses focus
      // (change). This is independent of the bundle's "Edit Account" save, so the email
      // is saved reliably regardless of the form's own submit behaviour.
      inp.addEventListener('change', function () {
        var m = location.pathname.match(/\/daybook\/editAccount\/([a-f0-9]{24})/i);
        if (m) saveEmailDirect(m[1], inp.value);
      });
    }
    relabel(wrap, 'Email (for referral notifications)');
    // strip any cloned validation markup
    wrap.querySelectorAll('.text-danger, .invalid-feedback, .error, .text-red-500').forEach(function (e) { e.remove(); });
    var typeCol = column(ctx.typeSel);
    typeCol.parentNode.insertBefore(wrap, typeCol.nextSibling);
    return wrap;
  }

  function ensureEmailField(ctx) {
    // Reset the stored value when we move to a different account/add form.
    if (boundId !== ctx.id) { boundId = ctx.id; emailValue = ''; }

    var isCommission = ctx.typeSel.value === 'Commission';
    var wrap = document.querySelector('[' + WRAP_ATTR + ']');

    if (!isCommission) { if (wrap) wrap.style.display = 'none'; return; }

    if (!wrap) wrap = buildField(ctx);
    else wrap.style.display = '';

    // Keep the visible input in sync with the stored value (survives recreation),
    // unless the user is actively typing in it.
    var inp = document.getElementById(FIELD_ID);
    if (inp && document.activeElement !== inp && inp.value !== emailValue) inp.value = emailValue;

    // Prefill the email on the edit page from the saved account (once per account).
    if (ctx.mode === 'editAccount' && !prefilledIds[ctx.id]) {
      prefilledIds[ctx.id] = true;
      fetch('/api/dayBook', { headers: { Authorization: 'Bearer ' + getToken() } })
        .then(function (r) { return r.json(); })
        .then(function (list) {
          var acct = (Array.isArray(list) ? list : []).find(function (a) { return String(a._id) === ctx.id; });
          if (acct && acct.email && !emailValue) {
            emailValue = acct.email;
            var f = document.getElementById(FIELD_ID);
            if (f && document.activeElement !== f) f.value = emailValue;
          }
        })
        .catch(function () { prefilledIds[ctx.id] = false; });
    }
  }

  // Append `email` to the account create/update request (read from the stored value).
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
      var wrap = document.querySelector('[' + WRAP_ATTR + ']');
      var visible = wrap && wrap.style.display !== 'none';
      if ((isAdd || isEdit) && visible && typeof body === 'string') {
        var live = document.getElementById(FIELD_ID);
        var email = (live && live.value) || emailValue || '';
        var payload = JSON.parse(body);
        payload.email = email;
        arguments[0] = JSON.stringify(payload);
        return _send.call(this, arguments[0]);
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
