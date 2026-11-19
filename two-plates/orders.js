const MaryOrders = (() => {
  'use strict';
  const storageKey = 'mk-cinema-demo-v2';
  const defaults = {
    slots: [
      { id: 'after', name: 'After-work plates', start: '17:00', end: '17:20', cap: 10 },
      { id: 'dinner', name: 'Dinner crew', start: '17:20', end: '17:40', cap: 12 },
      { id: 'evening', name: 'Evening pickup', start: '17:40', end: '18:00', cap: 10 }
    ],
    orders: [],
    clock: 1030, nextId: 205, pickupDetails: { location: '', instructions: '' }
  };

  function read() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(storageKey));
      if (Array.isArray(stored?.slots) && Array.isArray(stored?.orders)) {
        return { ...structuredClone(defaults), ...stored };
      }
    } catch {}
    return structuredClone(defaults);
  }

  function write(state) {
    sessionStorage.setItem(storageKey, JSON.stringify(state));
  }

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

  return { read, write, storageKey, phoneNumber, pickupFor, readyMessage, textLink };
})();
