// Mary's Kitchen orders, saved on SiteStyles (not in this browser).
//   Customer page: reads dinner windows and plates left, and places orders.
//   Kitchen board: Mary signs in to her SiteStyles account to see and update orders.
// The rest of the site code still calls read()/write() like the original demo; this file keeps a
// copy of the server state and sends only what changed.
const MaryOrders = (() => {
  'use strict';
  const slug = 'marys-kitchen';
  const api = '/api/kitchen/' + slug;
  const storageKey = 'mk-cinema-live';
  let state = null, saved = null, mode = 'public', onRefresh = null, saving = Promise.resolve();
  const draftTimers = {};

  async function call(path, opts = {}) {
    const res = await fetch(api + path, { method: opts.method || 'GET', credentials: 'same-origin', cache: 'no-store',
      headers: opts.body ? { 'Content-Type': 'application/json' } : {}, body: opts.body ? JSON.stringify(opts.body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const err = new Error(data.error || 'Something went wrong. Please try again.'); err.status = res.status; throw err; }
    return data;
  }
  const snap = s => JSON.parse(JSON.stringify({ slots: s.slots, pickupDetails: s.pickupDetails, orders: s.orders.map(o => ({ id: o.id, status: o.status, readyDraft: o.readyDraft ?? null })) }));

  async function fetchState() {
    const data = await call(mode === 'board' ? '/board' : '/public');
    if (mode === 'public') data.orders = [];
    return data;
  }
  // Load once before the page's code runs, then call fn.
  async function boot(kind, fn) {
    mode = kind;
    try { state = await fetchState(); }
    catch (err) { if (kind === 'board') return locked(err); state = { slots: [], orders: [], pickupDetails: { location: '', instructions: '' }, clock: 0, offline: true }; }
    saved = snap(state);
    fn();
    if (kind === 'board') setInterval(refresh, 15000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  }
  // Pull the latest orders onto the board without wiping something Mary is typing.
  async function refresh() {
    if (!state || document.hidden) return;
    const ae = document.activeElement; // only wait while Mary is typing in a field
    const busy = ae && ae.matches && ae.matches('input,textarea,select') && ae.closest('.contact-draft,.slot-form,#pickup-settings');
    if (busy) return;
    try {
      await saving;
      const fresh = await fetchState();
      state.orders.splice(0, state.orders.length, ...fresh.orders);
      state.slots.splice(0, state.slots.length, ...fresh.slots);
      Object.assign(state.pickupDetails, fresh.pickupDetails);
      state.clock = fresh.clock;
      saved = snap(state);
      if (onRefresh) onRefresh(state);
    } catch (err) { if (err.status === 401 || err.status === 403) locked(err); }
  }
  function read() { return state; }
  // Send what changed since the last save (order status, edited pickup texts, windows, pickup details).
  function write(next) {
    if (mode !== 'board' || !state) return;
    const now = snap(next), before = new Map(saved.orders.map(o => [o.id, o])), jobs = [];
    for (const o of now.orders) {
      const b = before.get(o.id); if (!b) continue;
      if (o.status !== b.status) jobs.push(() => call('/orders/' + o.id, { method: 'POST', body: { status: o.status, readyDraft: o.readyDraft ?? undefined } }));
      else if (o.readyDraft !== b.readyDraft && o.readyDraft != null) {
        clearTimeout(draftTimers[o.id]);
        draftTimers[o.id] = setTimeout(() => { saving = saving.then(() => call('/orders/' + o.id, { method: 'POST', body: { readyDraft: o.readyDraft } })).catch(problem); }, 700);
      }
    }
    if (JSON.stringify(now.slots) !== JSON.stringify(saved.slots) || JSON.stringify(now.pickupDetails) !== JSON.stringify(saved.pickupDetails))
      jobs.push(() => call('/settings', { method: 'PUT', body: { slots: now.slots, pickupDetails: now.pickupDetails } }));
    saved = now;
    for (const job of jobs) saving = saving.then(job).catch(problem);
  }
  function problem(err) {
    const t = document.getElementById('toast');
    if (t) { t.textContent = err.message || 'Couldn’t save that change. Check your connection.'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 4000); }
    if (err.status === 401 || err.status === 403) locked(err);
  }
  function locked(err) {
    const next = location.pathname + location.search;
    const box = document.createElement('div');
    box.className = 'mk-locked';
    box.innerHTML = '<div><p class="eyebrow">MARY’S KITCHEN BOARD</p><h1>' + (err && err.status === 403 ? 'This board belongs to Mary’s account.' : 'Sign in to open your kitchen board.') + '</h1>' +
      '<p>Orders and customer phone numbers are private. Sign in with the email on your SiteStyles account.</p>' +
      '<a class="mk-locked-btn" href="/login?next=' + encodeURIComponent(next) + '">Sign in</a> <a class="mk-locked-link" href="./">Back to the menu</a></div>';
    document.body.replaceChildren(box);
  }
  // Customer: place an order. Returns { id, pickup }.
  async function placeOrder(order) { return call('/orders', { method: 'POST', body: order }); }

  function phoneNumber(value) {
    const phone = String(value || '').trim();
    if (!/^\+?[\d\s().-]+$/.test(phone)) return '';
    const digits = phone.replace(/\D/g, '');
    if (phone.startsWith('+')) return /^[1-9]\d{7,14}$/.test(digits) ? '+' + digits : '';
    if (/^\d{10}$/.test(digits)) return '+1' + digits;
    if (/^1\d{10}$/.test(digits)) return '+' + digits;
    return '';
  }

  function pickupFor(slot, details) {
    return { name: slot.name, start: slot.start, end: slot.end,
      location: details.location || '', instructions: details.instructions || '' };
  }

  function readyMessage(order, pickup, formatTime) {
    const sentences = [
      'Hi ' + order.name + '! Your order MK-' + order.id + ' is ready for pickup at Mary’s Kitchen.',
      'Your pickup window is ' + formatTime(pickup.start) + '–' + formatTime(pickup.end) + ' (' + pickup.name + ').'
    ];
    if (pickup.location) sentences.push('Pickup spot: ' + pickup.location);
    if (pickup.instructions) sentences.push(pickup.instructions);
    if (!pickup.location && !pickup.instructions) sentences.push('Reply here if you need directions.');
    return sentences.join('\n');
  }

  function textLink(phone, body) {
    // Apple Messages and Android messaging apps use different body separators.
    const appleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    return 'sms:' + phone + (appleMobile ? '&body=' : '?body=') + encodeURIComponent(body);
  }

  return { boot, read, write, refresh, placeOrder, storageKey, phoneNumber, pickupFor, readyMessage, textLink,
    set onRefresh(fn) { onRefresh = fn; } };
})();
