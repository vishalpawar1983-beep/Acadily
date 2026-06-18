/**
 * Enquiry delete safeguard.
 *
 * On the "View All Enquiry" page (/view-form-data/...), intercept clicks on the
 * per-row and bulk delete (trash) buttons in CAPTURE phase — before React's handler —
 * and ask for confirmation. If the user cancels, the click is blocked so no delete
 * request is sent. Deletes are soft (the server keeps the row), so the dialog says the
 * enquiry can be recovered.
 */
(function () {
  'use strict';

  document.addEventListener(
    'click',
    function (e) {
      if (!/\/view-form-data\//i.test(location.pathname)) return;
      var btn = e.target.closest && e.target.closest('a, button');
      if (!btn) return;
      var iconCls = (btn.querySelector && btn.querySelector('i') ? btn.querySelector('i').className : '') || '';
      var isTrash = /ki-trash|trash/i.test(iconCls) || /\btrash\b/i.test(btn.className || '');
      if (!isTrash) return;

      var inRow = !!(btn.closest && btn.closest('tbody tr'));
      var msg = inRow
        ? 'Delete this enquiry?\n\nIt will be removed from the list. It is kept on the server and can be recovered if needed.'
        : 'Delete the selected enquiries?\n\nThey will be removed from the list. They are kept on the server and can be recovered if needed.';

      if (!window.confirm(msg)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true, // capture phase — runs before React's delegated handler
  );
})();
