(()=>{'use strict';
const $ = id => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const load = MaryOrders.read;
const min=t=>{const a=t.split(':').map(Number);return a[0]*60+a[1]},time=t=>{const m=min(t),h=Math.floor(m/60);return(h%12||12)+':'+String(m%60).padStart(2,'0')+' '+(h>=12?'PM':'AM')},esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let paused=reduced,foodPlaying=false;const hero=$('welcome-video'),food=$('food-video');function playback(){const playing=!hero.paused;$('film-toggle').textContent=playing?'Pause film':'Play film';$('film-toggle').classList.toggle('is-paused',!playing);$('play-welcome').hidden=playing||paused}async function playHero(){if(paused||document.hidden||$('review-dialog').open)return;hero.muted=true;hero.setAttribute('muted','');try{await hero.play()}catch{}playback()}
hero.addEventListener('playing',playback);hero.addEventListener('pause',playback);hero.addEventListener('error',()=>{$('play-welcome').hidden=false;$('play-welcome').textContent='Explore the food below ↓';$('play-welcome').onclick=()=>$('food').scrollIntoView()});$('film-toggle').onclick=()=>{paused=!hero.paused;document.body.classList.toggle('paused',paused);if(paused)hero.pause();else playHero();playback()};$('play-welcome').onclick=()=>{paused=false;document.body.classList.remove('paused');playHero()};if(reduced){hero.autoplay=false;hero.pause();document.body.classList.add('paused')}else playHero();
document.addEventListener('visibilitychange',()=>{if(document.hidden){hero.pause();food.pause()}else{playHero();if(foodPlaying&&!$('review-dialog').open)food.play().catch(()=>{})}});$('food-film-toggle').onclick=()=>{if(food.paused){foodPlaying=true;food.play().then(()=>{$('food-film-toggle').textContent='Pause the close-ups'}).catch(()=>{$('food-film-toggle').textContent='Tap to play the close-ups'})}else{foodPlaying=false;food.pause();$('food-film-toggle').textContent='Watch the food close-ups'}};
if('IntersectionObserver'in window&&!reduced){document.body.classList.add('motion-ready');const ob=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('shown');ob.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(e=>ob.observe(e))}
document.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-day]').forEach(x=>x.setAttribute('aria-selected',String(x===b)));$('day-kicker').textContent=b.dataset.day.toUpperCase()+' · EXAMPLE DAY';$('day-title').textContent=b.dataset.day==='Wednesday'?'Menu reveal coming soon.':'Next pop-up details coming soon.';$('day-panel').setAttribute('aria-labelledby',b.id)});document.querySelectorAll('[data-vote]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-vote]').forEach(x=>{x.setAttribute('aria-pressed',String(x===b));x.querySelector('span').textContent=x===b?'♥':'♡'});try{sessionStorage.setItem('mk-demo-vote',b.dataset.vote)}catch{}$('vote-status').textContent='You chose '+b.dataset.vote.toLowerCase()+'. Demo vote saved here; nothing sent to Mary.'});
document.querySelectorAll('[data-clip]').forEach(b=>b.onclick=()=>{hero.pause();food.pause();$('review-player').src='../assets/'+b.dataset.clip+'.mp4';$('review-dialog').showModal();$('review-player').play().catch(()=>{})});$('review-dialog').addEventListener('close',()=>{$('review-player').pause();$('review-player').removeAttribute('src');$('review-player').load();playHero();if(foodPlaying)food.play().catch(()=>{})});document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));function scrollReels(dir){const t=$('reaction-track');t.scrollBy({left:dir*(t.firstElementChild.offsetWidth+24),behavior:reduced?'instant':'smooth'})}$('prev-reel').onclick=()=>scrollReels(-1);$('next-reel').onclick=()=>scrollReels(1);

const plateForm = $('plate-form');
const pickupForm = $('pickup-form');
const cartStorageKey = 'mk-two-plates-cart-v1';
const maxPlates = 10;
const sideInputs = [...plateForm.querySelectorAll('[name="sides"]')];
const optionValues = select => [...select.options].map(option => option.value);
const sidesAvailable = sideInputs.map(input => input.value);
const proteins = { pasta: ['Chicken', 'Shrimp', 'Salmon', 'Steak'], comfort: ['Fried chicken'] };
let lines = [];
try {
  const stored = JSON.parse(sessionStorage.getItem(cartStorageKey) || '[]');
  const ids = new Set();
  if (Array.isArray(stored)) lines = stored.filter(line => {
    if (!line || typeof line.id !== 'string' || !/^[a-f0-9-]{36}$/.test(line.id) || ids.has(line.id)) return false;
    if (!Object.hasOwn(proteins, line.base) || !proteins[line.base].includes(line.protein)) return false;
    if (!Array.isArray(line.sides) || new Set(line.sides).size !== 2 || line.sides.length !== 2 || !line.sides.every(side => sidesAvailable.includes(side))) return false;
    if (!optionValues($('plate-drink')).includes(line.drink) || !optionValues($('plate-dessert')).includes(line.dessert)) return false;
    ids.add(line.id);
    return true;
  }).slice(0, maxPlates);
} catch {}
let stage = lines.length ? 'cart' : 'plate';
let editingId = null;
let selectedWindow = '';
const lineTitle = line => line.base === 'comfort' ? 'Fried chicken comfort plate' : line.protein + ' rasta pasta';
function keepCart() {
  try { sessionStorage.setItem(cartStorageKey, JSON.stringify(lines)); } catch {}
}
function proteinOptions(base, selected) {
  const choices = proteins[base];
  $('protein').replaceChildren(...choices.map(value => new Option(value, value)));
  $('protein').value = choices.includes(selected) ? selected : choices[0];
}
function updateSideCount() {
  const count = sideInputs.filter(input => input.checked).length;
  $('side-count').textContent = count + ' of 2 selected' + (count === 2 ? ' · Uncheck a side to change it.' : '');
  sideInputs.forEach(input => { input.disabled = count === 2 && !input.checked; });
}
function plateCard(line, index) {
  const title = lineTitle(line);
  const actions = stage === 'cart' ? '<div class="line-actions">' +
    '<button type="button" class="plate-link" data-do="edit" aria-label="Edit plate ' + (index+1) + '">Edit</button>' +
    (lines.length < maxPlates ? '<button type="button" class="plate-link" data-do="copy" aria-label="Add another like plate ' + (index+1) + '">Add another like this</button>' : '') +
    '<button type="button" class="plate-link" data-do="remove" aria-label="Remove plate ' + (index+1) + '">Remove</button></div>' : '';
  return '<li data-line="' + esc(line.id) + '"><h4>Plate ' + (index+1) + ' · ' + esc(title) + '</h4>' +
    '<p>Two sides · ' + line.sides.map(esc).join(' and ') + '</p>' +
    '<p>Drink · ' + esc(line.drink) + '</p><p>Dessert · ' + esc(line.dessert) + '</p>' + actions + '</li>';
}
function paint() {
  plateForm.hidden = stage !== 'plate';
  pickupForm.hidden = stage !== 'pickup';
  $('order-cart').hidden = !lines.length;
  $('cart-actions').hidden = stage !== 'cart';
  $('new-plate').hidden = lines.length >= maxPlates;
  $('cart-lines').innerHTML = lines.map(plateCard).join('');
  $('summary-title').textContent = lines.length ? lines.length + (lines.length === 1 ? ' plate.' : ' plates.') : 'Your first plate.';
  $('summary-detail').textContent = stage === 'pickup' ? 'One dinner window for the whole order.' : lines.length ? 'Each plate keeps its own choices.' : 'Choose what goes on it.';
  const art = stage === 'plate' ? plateForm.elements.base.value : lines[0]?.base;
  $('summary-photo').src = '../assets/' + (art === 'comfort' ? 'chicken' : 'pasta') + '-retouched.png';
}
function openPlate(from = null, edit = false, focus = true) {
  editingId = edit ? from.id : null;
  const position = edit ? lines.findIndex(line => line.id === editingId)+1 : lines.length+1;
  const base = from?.base || 'pasta';
  plateForm.elements.base.value = base;
  proteinOptions(base, from?.protein || 'Steak');
  sideInputs.forEach(input => { input.checked = from?.sides.includes(input.value) || false; });
  $('plate-drink').value = from?.drink || 'No drink';
  $('plate-dessert').value = from?.dessert || 'No dessert';
  $('plate-heading').textContent = (edit ? 'Edit plate ' : 'Build plate ') + position;
  $('save-plate').textContent = edit ? 'Save plate changes' : 'Add plate to order';
  $('cancel-plate').hidden = !lines.length;
  $('plate-error').textContent = '';
  updateSideCount();
  stage = 'plate';
  paint();
  if (focus) $('plate-heading').focus();
}
function showCart(message = '') {
  editingId = null;
  stage = 'cart';
  $('cart-status').textContent = message;
  paint();
  $('cart-heading').focus();
}
plateForm.querySelectorAll('[name="base"]').forEach(input => input.addEventListener('change', () => {
  proteinOptions(plateForm.elements.base.value, $('protein').value);
  paint();
}));
sideInputs.forEach(input => input.addEventListener('change', () => {
  updateSideCount();
  $('plate-error').textContent = '';
}));
plateForm.addEventListener('submit', event => {
  event.preventDefault();
  const selectedSides = sideInputs.filter(input => input.checked).map(input => input.value);
  if (selectedSides.length !== 2) {
    $('plate-error').textContent = 'Choose two sides for this plate.';
    sideInputs.find(input => !input.checked)?.focus();
    return;
  }
  if (!editingId && lines.length >= maxPlates) {
    $('plate-error').textContent = 'You can add up to 10 plates per order.';
    return;
  }
  const line = { id: editingId || crypto.randomUUID(), base: plateForm.elements.base.value,
    protein: $('protein').value, sides: selectedSides, drink: $('plate-drink').value, dessert: $('plate-dessert').value };
  if (editingId) lines = lines.map(item => item.id === editingId ? line : item);
  else lines.push(line);
  keepCart();
  showCart('Plate saved.');
});
$('cancel-plate').addEventListener('click', () => showCart());
$('new-plate').addEventListener('click', () => openPlate());
$('cart-lines').addEventListener('click', event => {
  const button = event.target.closest('button[data-do]');
  if (!button || stage !== 'cart') return;
  const line = lines.find(item => item.id === button.closest('[data-line]').dataset.line);
  if (!line) return;
  if (button.dataset.do === 'edit') return openPlate(line, true);
  if (button.dataset.do === 'copy') return openPlate(line);
  lines = lines.filter(item => item.id !== line.id);
  keepCart();
  if (!lines.length) openPlate(); else showCart('Plate removed.');
});
function platesLeft(current, slot) {
  const reserved = current.orders.filter(order => order.slot === slot.id)
    .reduce((sum, order) => sum + order.items.reduce((total,item) => total + item.qty, 0), 0);
  return Math.max(0, slot.cap - reserved);
}
function renderDinnerWindows() {
  const current = load();
  const detail = $('pickup-detail');
  detail.textContent = [current.pickupDetails.location, current.pickupDetails.instructions].filter(Boolean).join(' · ');
  detail.hidden = !detail.textContent;
  const available = current.slots.filter(slot => min(slot.start) > current.clock && platesLeft(current, slot) >= lines.length);
  if (!available.some(slot => slot.id === selectedWindow)) selectedWindow = '';
  $('pickup-options').innerHTML = current.slots.map(slot => {
    const closed = min(slot.start) <= current.clock;
    const room = platesLeft(current, slot);
    return '<label class="pickup-choice"><input type="radio" name="slot" value="' + esc(slot.id) + '" required' +
      (slot.id === selectedWindow ? ' checked' : '') + (closed || room < lines.length ? ' disabled' : '') + '>' +
      '<span><strong>' + esc(slot.name) + '</strong><small>' + esc(time(slot.start)) + ' – ' + esc(time(slot.end)) + '</small></span>' +
      '<span>' + (closed ? 'Closed' : room + (room === 1 ? ' plate left' : ' plates left')) + '</span></label>';
  }).join('');
  $('place-order').disabled = !available.length;
  if (!available.length) $('pickup-error').textContent = 'No dinner window has room for this whole order. You can go back and change your plates.';
}
$('go-pickup').addEventListener('click', () => {
  if (!lines.length) return;
  stage = 'pickup';
  $('pickup-error').textContent = '';
  paint(); renderDinnerWindows(); $('pickup-heading').focus();
});
$('back-to-plates').addEventListener('click', () => showCart());
$('pickup-options').addEventListener('change', () => { selectedWindow = pickupForm.elements.slot.value; });
$('guest-phone').addEventListener('input', () => {
  if ($('guest-phone').hasAttribute('aria-invalid')) {
    $('guest-phone').removeAttribute('aria-invalid');
    $('pickup-error').textContent = '';
  }
});
pickupForm.addEventListener('submit', event => {
  event.preventDefault();
  if (stage !== 'pickup' || !lines.length) return;
  const current = load();
  const name = $('guest-name').value.trim();
  const phoneField = $('guest-phone');
  const phone = phoneField.value.trim();
  if (!MaryOrders.phoneNumber(phone)) {
    phoneField.setAttribute('aria-invalid', 'true');
    $('pickup-error').textContent = 'Enter a 10-digit US number, or include + and the country code.';
    phoneField.focus();
    return;
  }
  const slot = current.slots.find(item => item.id === pickupForm.elements.slot.value);
  if (!name || !slot || min(slot.start) <= current.clock || platesLeft(current, slot) < lines.length) {
    $('pickup-error').textContent = 'Enter a name and choose a dinner window with room for every plate.';
    renderDinnerWindows();
    return;
  }
  const orderId = Math.max(current.nextId || 205, ...current.orders.map(order => order.id + 1));
  const items = lines.map(line => ({ label: lineTitle(line), qty: 1, price: 0, sides: [...line.sides], drink: line.drink, dessert: line.dessert }));
  const pickup = MaryOrders.pickupFor(slot, current.pickupDetails);
  current.orders.push({ id: orderId, name, contact: { phone }, pickup, slot: slot.id, items, status: 'queued', waiting: 0 });
  current.nextId = orderId+1;
  try { MaryOrders.write(current); }
  catch { $('pickup-error').textContent = 'This browser could not save the sample order. Your plates are still here.'; return; }
  $('confirmation-copy').textContent = 'MK-' + orderId + ' · ' + name + ' · ' + lines.length + (lines.length === 1 ? ' plate' : ' plates') +
    ' · ' + slot.name + ' · ' + time(slot.start) + '–' + time(slot.end);
  lines = []; selectedWindow = ''; keepCart(); pickupForm.reset(); openPlate(null, false, false);
  $('confirmation').showModal();
});
if (lines.length) paint(); else openPlate(null, false, false);

try{const v=sessionStorage.getItem('mk-demo-vote');const b=[...document.querySelectorAll('[data-vote]')].find(x=>x.dataset.vote===v);if(b)b.click()}catch{};})();
