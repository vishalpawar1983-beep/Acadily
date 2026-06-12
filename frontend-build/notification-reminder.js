/**
 * IMS Reminder Notification System
 *
 * Countdown sequence per reminder:
 *   T-5 min  → "Reminder in 5 minutes"
 *   T-4 min  → "Reminder in 4 minutes"
 *   T-3 min  → "Reminder in 3 minutes"
 *   T-2 min  → "Reminder in 2 minutes"
 *   T-1 min  → "Reminder in 1 minute"
 *   T-0      → "Reminder NOW"
 *
 * Works on every page/screen (injected into the SPA shell index.html).
 * Repeats every day until endDate. Polls every 60 s for new reminders.
 */
(function () {
  'use strict';

  var ONE_MIN_MS   = 60 * 1000;
  var EARLY_MS     = 5 * ONE_MIN_MS;   // countdown starts 5 min before
  var POLL_MS      = ONE_MIN_MS;       // re-fetch reminders every minute
  var STORAGE_KEY  = 'ims_rfired';     // sessionStorage dedup key

  // ── Token ───────────────────────────────────────────────────────────────────
  function getToken() {
    try {
      var raw = localStorage.getItem('kt-auth-react-v');
      if (raw) {
        var o = JSON.parse(raw);
        if (o && o.api_token)    return o.api_token;
        if (o && o.token)        return o.token;
        if (o && o.accessToken)  return o.accessToken;
      }
    } catch (e) {}
    var keys = ['api_token', 'token', 'authToken', 'accessToken'];
    for (var i = 0; i < keys.length; i++) {
      var v = localStorage.getItem(keys[i]);
      if (v && v.length > 20) return v;
    }
    return null;
  }

  // ── Bell sound (Web Audio — no external file) ───────────────────────────────
  function beep(urgent) {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ctx  = new AC();
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = urgent ? 'square' : 'sine';
      osc.frequency.setValueAtTime(urgent ? 1046 : 880, ctx.currentTime);
      gain.gain.setValueAtTime(0.45, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (urgent ? 1.8 : 1.2));
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime  + (urgent ? 1.8 : 1.2));
    } catch (e) {}
  }

  // ── Notification ─────────────────────────────────────────────────────────────
  function notify(title, body, tag, urgent) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      var n = new Notification(title, {
        body: body,
        icon: '/media/logos/favicon.ico',
        tag: tag,
        requireInteraction: urgent || false,
      });
      beep(urgent);
      if (!urgent) setTimeout(function () { n.close(); }, 10000);
    } catch (e) {}
  }

  // ── Dedup store (sessionStorage — resets per browser session) ───────────────
  function fired(k) {
    try { return !!JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}')[k]; }
    catch (e) { return false; }
  }
  function markFired(k) {
    try {
      var o = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      o[k] = true;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(o));
    } catch (e) {}
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function todayStr() { return new Date().toDateString(); }

  /** Return today's Date at the same HH:MM:SS as the stored startTime */
  function todayAt(startTime) {
    var st = new Date(startTime);
    var d  = new Date();
    d.setHours(st.getHours(), st.getMinutes(), st.getSeconds(), 0);
    return d;
  }

  function isActiveToday(r) {
    if (!r.startTime) return false;
    if (!r.endDate)   return true;
    var end = new Date(r.endDate);
    end.setHours(23, 59, 59, 999);
    return Date.now() <= end.getTime();
  }

  // ── Schedule countdown for one reminder ─────────────────────────────────────
  //
  //  Countdown steps (minsLeft = 5,4,3,2,1,0):
  //    scheduleStep is called once for each step.
  //    It fires right away if the step has already passed today (so opening
  //    the page mid-countdown still shows the remaining steps immediately),
  //    otherwise it waits for the right moment.
  //
  function scheduleStep(r, minsLeft, exactMs, text, dateKey) {
    var stepMs  = exactMs - minsLeft * ONE_MIN_MS;  // wall-clock ms for this step
    var now     = Date.now();
    var stepKey = r._id + ':m' + minsLeft + ':' + dateKey;

    if (fired(stepKey)) return;  // already shown this session

    function fire() {
      if (fired(stepKey)) return;
      markFired(stepKey);
      if (minsLeft === 0) {
        notify('🔔 Reminder', text, stepKey, true /* urgent */);
      } else {
        var label = minsLeft === 1 ? '1 minute' : minsLeft + ' minutes';
        notify('⏰ Reminder in ' + label, text, stepKey, false);
      }
    }

    if (stepMs <= now) {
      // This step's time has already passed today — fire immediately on page load
      fire();
    } else {
      // Schedule for the future
      setTimeout(fire, stepMs - now);
    }
  }

  function schedule(r) {
    if (!isActiveToday(r)) return;

    var exactMs = todayAt(r.startTime).getTime();
    var text    = r.particulars || 'Reminder';
    var dateKey = todayStr();
    var now     = Date.now();

    // Only schedule steps that are within the countdown window
    // (i.e. exactMs is in the future, or the countdown started but not finished)
    if (exactMs - EARLY_MS > now + 60000) return; // reminder is > 6 min away; will be picked up by next poll

    for (var mins = 5; mins >= 0; mins--) {
      scheduleStep(r, mins, exactMs, text, dateKey);
    }
  }

  // ── Fetch & schedule ─────────────────────────────────────────────────────────
  function fetchAndSchedule() {
    var token = getToken();
    if (!token) return;

    fetch('/api/student-notes/reminders', {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
    })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        var list = (data && (data.reminders || data.data)) || [];
        list.forEach(schedule);
      })
      .catch(function () {});
  }

  // ── Permission + boot ─────────────────────────────────────────────────────────
  function startPolling() {
    fetchAndSchedule();
    setInterval(fetchAndSchedule, POLL_MS);
  }

  function boot() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      startPolling();
    } else if (Notification.permission !== 'denied') {
      setTimeout(function () {
        Notification.requestPermission().then(function (p) {
          if (p === 'granted') startPolling();
        });
      }, 3000);
    }
  }

  // Re-check on tab focus (overnight / background tab scenario)
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') fetchAndSchedule();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
