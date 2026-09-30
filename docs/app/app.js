// Pet Dock for phones & tablets (web app on iPhone/iPad, UI of the Android app).
// Everything stays on the device: settings in localStorage, downloaded pets in IndexedDB.
const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const Native = window.PetDockAndroid || null; // bridge provided by the Android app
const BUILTIN_REAL = new Set(Object.keys(REAL_PETS.pets));

// ---------- settings ----------
const DEFAULTS = {
  onboarded: false, owner: '', name: 'Mochi', petId: 'cat-orange',
  ageMode: 'grow', grown: false, care: { points: 0, last: {} },
  reminders: { water: true, waterMin: 45, rest: true, restMin: 60 },
  chatter: true, focusEndsAt: 0, overlay: false, installTipClosed: false,
};
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('petdock') || '{}');
    return { ...DEFAULTS, ...s, reminders: { ...DEFAULTS.reminders, ...(s.reminders || {}) }, care: { ...DEFAULTS.care, ...(s.care || {}) } };
  } catch { return structuredClone(DEFAULTS); }
}
let S = loadSettings();
function save() {
  try { localStorage.setItem('petdock', JSON.stringify(S)); } catch { /* private mode: still works for this visit */ }
  if (Native) Native.setReminders(JSON.stringify({ ...S.reminders, owner: S.owner, name: S.name }));
}

const typeOf = (id) => id.slice(0, id.indexOf('-'));
const variantOf = (id) => id.slice(id.indexOf('-') + 1);
const kind = () => (['cat', 'dog', 'pig'].includes(typeOf(S.petId)) ? typeOf(S.petId) : 'custom');
const labelOf = (id) => (PETS[typeOf(id)] && PETS[typeOf(id)].variants[variantOf(id)] || {}).label || id;
function list(key) {
  const v = PHRASES[key];
  return Array.isArray(v) ? v : (v[kind()] || v.cat);
}
const phrase = (key, extra) => pick(list(key), { owner: S.owner || 'bạn', name: S.name }, extra);

// Built-in images ship with the app; downloaded ones come from IndexedDB as blob URLs.
function petSrc(id, baby, pose) {
  const e = REAL_PETS.pets[id];
  if (e && e.urls) return e.urls[(baby ? 'baby/' : '') + pose] || e.urls[pose];
  return `pets/${id}/${baby ? 'baby/' : ''}${pose}.webp`;
}
const stage = () => (S.ageMode === 'baby' ? 'baby' : S.ageMode === 'adult' ? 'adult' : S.grown ? 'adult' : 'baby');
const isBaby = (id = S.petId) => stage() === 'baby' && !!(REAL_PETS.pets[id] && REAL_PETS.pets[id].baby);

// Suggested names and "sales pitch" per built-in pet (same as the desktop welcome shelf).
const INTRO = {
  'cat-orange': ['Cam', 'Em là mèo cam, ăn hơi nhiều nhưng thương {owner} nhiều hơn!'],
  'dog-corgi': ['Bơ', 'Chân ngắn nhưng chạy tới {owner} nhanh nhất!'],
  'cat-gray': ['Mướp', 'Oáp… chọn em rồi mình ngủ trưa chung nha'],
  'dog-poodle': ['Bông', 'Em xù xù, ôm êm lắm đó {owner}!'],
  'cat-black': ['Mun', 'Mèo mun mang may mắn đó, {owner} biết chưa?'],
  'dog-shiba': ['Mochi', 'Nụ cười Shiba chữa lành đây, nhận không {owner}?'],
  'cat-white': ['Tuyết', 'Em nhắc {owner} uống nước đều đều cho da đẹp~'],
  'dog-golden': ['Mật', 'Ai buồn là em ôm hết, em hiền nhất đó'],
  'cat-calico': ['Mía', 'Mèo tam thể mang tài lộc đó {owner} ơi!'],
  'dog-vang': ['Vàng', 'Chó ta trung thành số một, chọn em nha!'],
  'cat-siamese': ['Sữa', 'Em dạy {owner} giãn cơ, làm theo em nè~'],
  'dog-muc': ['Mực', 'Chó mực canh nhà, còn em canh {owner}!'],
  'cat-heart': ['Tim', 'Em có trái tim ngay trên miệng, dành hết cho {owner} đó 💗'],
  'pig-pink': ['Ủn', 'Ụt ịt~ em tròn tròn, ôm vô là hết buồn!'],
};
const introOf = (id) => INTRO[id] || [(PETS[typeOf(id)]?.variants[variantOf(id)]?.name) || labelOf(id), 'Em mới dọn tới xóm nè, đón em về nha {owner}!'];

// ---------- the pet ----------
const room = $('room');
const pet = createRoomPet(room, {
  onTap() {
    if (pet.state === 'sleep' || pet.state === 'focus') {
      if (S.focusEndsAt) { pet.say(phrase('focusPoke'), 2500); return; }
      pet.setState('idle', 1500);
      pet.say(phrase('wake'), 2500);
      return;
    }
    pet.setState('happy', 1800);
    pet.jump(520);
    pet.hearts(2);
    pet.say(phrase('click'), 2500);
    care('pet');
  },
  onPurr() { pet.setState('sit', 4000); pet.hearts(3); pet.say(phrase('purr'), 2500); care('pet'); },
  onTripleTap() { highFive(); },
});

function showPet() {
  const id = REAL_PETS.pets[S.petId] ? S.petId : 'cat-orange';
  S.petId = id;
  const baby = isBaby(id);
  const e = REAL_PETS.pets[id];
  pet.load({ poses: baby ? e.baby.poses : e.poses, src: (p) => petSrc(id, baby, p), baby });
  $('petNameText').textContent = S.name;
  $('stageTag').textContent = stage() === 'baby' ? '🍼 con non' : '';
  const g = S.ageMode === 'grow' && !S.grown ? S.care.points / 30 : 1;
  $('growFill').style.width = Math.round(g * 100) + '%';
  $('growWrap').title = S.ageMode === 'grow' && !S.grown ? `Bé đang lớn: ${Math.round(g * 100)}%` : 'Bé đã lớn';
}

// ---------- growing up (never subtracts) ----------
const GROW_AT = 30;
const CARE_POINTS = { highfive: 3, water: 2, stretch: 2, breathe: 3, vent: 2, focus: 3, feed: 1, pet: 1 };
function care(k) {
  const pts = CARE_POINTS[k];
  const last = S.care.last || {};
  if (!pts || Date.now() - (last[k] || 0) < 10 * 60000) return;
  last[k] = Date.now();
  S.care = { points: Math.min(GROW_AT, (S.care.points || 0) + pts), last };
  const growsNow = S.ageMode === 'grow' && !S.grown && S.care.points >= GROW_AT;
  if (growsNow) S.grown = true;
  save();
  if (growsNow) {
    showPet();
    pet.setState('happy', 3000);
    pet.jump(700);
    pet.hearts(6, '🎉');
    pet.say(phrase('grown'), 5000).then(() => pet.say(phrase('grownThanks'), 5000));
  } else showPet();
}

// ---------- high-five ----------
async function highFive(askKey = 'highFiveAsk') {
  pet.busy('highfive');
  pet.say(phrase(askKey), 15000);
  const done = await pet.raisePaw(15000);
  pet.busy(null);
  if (done) {
    pet.hideBubble();
    pet.hearts(5, '✨');
    pet.jump(600);
    pet.say(phrase('highFiveDone'), 3500);
    care('highfive');
  } else pet.hideBubble();
}

// ---------- quick actions ----------
async function drinkWater() { care('water'); await highFive('waterDone'); }
async function doStretch() {
  pet.busy('stretch');
  pet.setState('stretch', 2600);
  pet.say(phrase('stretch'), 3000);
  await wait(2800);
  pet.busy(null);
  care('stretch');
  await highFive('stretchDone');
}
function feed() {
  pet.setState('eat', 2800);
  pet.say(phrase('feed'), 2800);
  pet.hearts(2, '🍗');
  care('feed');
}

// ---------- breathing: 6 × (4s in, 6s out) ----------
let breathing = null;
async function breathe() {
  if (breathing) return;
  const run = breathing = { stop: false };
  pet.busy('breathe');
  pet.walkTo(pet.center(), () => pet.setState('breathe'));
  $('breath').classList.remove('hidden');
  pet.say(phrase('breatheStart'), 3000);
  await wait(2500);
  for (let i = 0; i < 6 && !run.stop; i++) {
    pet.setState('breathe');
    $('ring').className = 'ring in';
    $('breathText').textContent = 'Hít vào…';
    await wait(4000);
    if (run.stop) break;
    $('ring').className = 'ring out';
    $('breathText').textContent = 'Thở ra… từ từ thôi';
    await wait(6000);
  }
  $('breath').classList.add('hidden');
  $('ring').className = 'ring';
  breathing = null;
  pet.busy(null);
  pet.setState('sit', 4000);
  if (!run.stop) { pet.say(phrase('breatheEnd'), 4000); care('breathe'); }
}
$('breathStop').addEventListener('click', () => { if (breathing) breathing.stop = true; });

// ---------- focus 25 min ----------
function focusTick() {
  if (!S.focusEndsAt) return;
  const left = S.focusEndsAt - Date.now();
  if (left <= 0) { endFocus(true); return; }
  const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
  $('focusLeft').textContent = `${m}:${String(s).padStart(2, '0')}`;
  if (pet.state !== 'focus' && !pet.st.held) pet.setState('focus');
}
function startFocus() {
  S.focusEndsAt = Date.now() + 25 * 60000;
  save();
  $('focusBar').classList.remove('hidden');
  pet.busy('focus');
  pet.setState('focus');
  pet.say(phrase('focusStart'), 4000);
  if (Native) Native.scheduleFocusEnd(String(S.focusEndsAt));
  focusTick();
}
async function endFocus(finished) {
  S.focusEndsAt = 0;
  save();
  $('focusBar').classList.add('hidden');
  if (Native) Native.scheduleFocusEnd('0');
  pet.busy(null);
  pet.setState('stretch', 2600);
  if (finished) { care('focus'); await wait(2600); await highFive('focusHighFive'); pet.say(phrase('focusAfter'), 4000); }
  else pet.setState('idle', 1000);
}
$('focusStop').addEventListener('click', () => endFocus(false));
setInterval(focusTick, 1000);

// ---------- reminders (while the app is open; Android also sends real notifications) ----------
const lastRemind = { water: Date.now(), rest: Date.now() };
async function remind(kindKey) {
  if (S.focusEndsAt || breathing || pet.st.busy || document.hidden) return;
  lastRemind[kindKey] = Date.now();
  if (kindKey === 'water') {
    const c = await pet.say(phrase('waterAsk'), 30000, [['done', '💧 Uống rồi!'], ['later', 'Lát nữa']]);
    if (c === 'done') drinkWater();
  } else {
    pet.setState('stretch', 2600);
    const c = await pet.say(phrase('rest'), 30000, [['done', '🙆 Xong rồi!'], ['later', 'Lát nữa']]);
    if (c === 'done') { care('stretch'); highFive('stretchDone'); }
  }
}
setInterval(() => {
  const r = S.reminders;
  if (r.water && Date.now() - lastRemind.water > r.waterMin * 60000) remind('water');
  else if (r.rest && Date.now() - lastRemind.rest > r.restMin * 60000) remind('rest');
  else if (S.chatter && Math.random() < 0.04 && !pet.st.busy && pet.state === 'idle') pet.say(phrase('chatter'), 3500);
}, 20000);

// Coming back to the app after a while = the pet notices.
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); pet.pause(true); return; }
  pet.pause(false);
  if (hiddenAt && Date.now() - hiddenAt > 5 * 60000 && !S.focusEndsAt && S.onboarded) {
    pet.setState('happy', 1800);
    pet.say(phrase('back'), 3000);
  }
  focusTick();
});

// ---------- vent corner ----------
const N = 18;
function rectPoints(w, h) {
  const per = 2 * (w + h), pts = [];
  for (let i = 0; i < N; i++) {
    let d = (i / N) * per;
    if (d < w) pts.push([d / w, 0]);
    else if ((d -= w) < h) pts.push([1, d / h]);
    else if ((d -= h) < w) pts.push([1 - d / w, 1]);
    else pts.push([0, 1 - (d - w) / h]);
  }
  return pts.map(([x, y]) => [x * 100, y * 100]);
}
function lumpPoints(rect, w, h, r, jag) {
  return rect.map(([px, py]) => {
    const a = Math.atan2((py / 100 - 0.5) * h, (px / 100 - 0.5) * w);
    const rr = r * (1 - jag + Math.random() * jag * 1.6);
    return [50 + (Math.cos(a) * rr / w) * 100, 50 + (Math.sin(a) * rr / h) * 100];
  });
}
const toClip = (pts) => `polygon(${pts.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(', ')})`;
let audio = null;
const sound = (dur, gain) => { try { audio = audio || new AudioContext(); crackle(audio, audio.currentTime, dur, gain); } catch { /* optional */ } };

const ventText = $('ventText');
let feeling = null;
function resetVent() {
  const paper = $('paper');
  paper.style.cssText = '';
  $('creases').style.opacity = '0';
  $('paperBall').className = 'paper-ball';
  $('care').classList.remove('show');
  ventText.readOnly = false;
  ventText.value = '';
  $('ventEat').disabled = true;
}
ventText.addEventListener('input', () => { $('ventEat').disabled = !ventText.value.trim(); });
$('ventEat').addEventListener('click', () => {
  feeling = readFeelings(ventText.value);
  $('ventEat').disabled = true;
  ventText.readOnly = true;
  ventText.blur();
  if (feeling.crisis) { $('care').classList.add('show'); return; }
  crumple();
});
$('care').addEventListener('click', (e) => {
  const b = e.target.closest('[data-then]');
  if (!b) return;
  if (b.dataset.then === 'overstated') { $('care').classList.remove('show'); crumple(); return; }
  ventText.value = '';
  closeSheet();
  pet.busy(null);
  pet.walkTo(pet.center(), () => pet.setState('sit', 60000));
  pet.hearts(2, '💛');
  pet.say(phrase('comfortCrisis'), 7000);
  if (b.dataset.then === 'breathe') setTimeout(breathe, 1500);
});

async function crumple() {
  const paper = $('paper');
  const { width: w, height: h } = paper.getBoundingClientRect();
  const rect = rectPoints(w, h);
  let lines = '';
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * w, y = Math.random() * h, a = Math.random() * Math.PI, l = 40 + Math.random() * 120;
    lines += `<path d="M${x} ${y}l${Math.cos(a) * l} ${Math.sin(a) * l}" stroke="rgba(120,105,85,.35)"/><path d="M${x + 1.2} ${y + 1.2}l${Math.cos(a) * l} ${Math.sin(a) * l}" stroke="rgba(255,255,255,.8)"/>`;
  }
  $('creases').innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${lines}</svg>`;
  paper.style.clipPath = toClip(rect);
  paper.getBoundingClientRect();
  const t = '.36s cubic-bezier(.55, 0, .55, 1)';
  paper.style.transition = `clip-path ${t}, transform ${t}`;
  sound(0.3, 0.05);
  $('creases').style.opacity = '1';
  paper.style.clipPath = toClip(lumpPoints(rect, w, h, Math.min(w, h) * 0.55, 0.35));
  paper.style.transform = 'rotate(-7deg) scale(.95)';
  if (navigator.vibrate) navigator.vibrate(20);
  await wait(360);
  sound(0.25, 0.06);
  paper.style.clipPath = toClip(lumpPoints(rect, w, h, 44, 0.3));
  paper.style.transform = 'rotate(12deg) scale(.9)';
  if (navigator.vibrate) navigator.vibrate(30);
  await wait(360);
  $('paperBall').innerHTML = paperBallSVG(96);
  paper.style.visibility = 'hidden';
  ventText.value = ''; // the words are gone; only the feeling label is kept, and only in memory
  $('paperBall').classList.add('pop');
  await wait(420);
  $('paperBall').classList.replace('pop', 'toss');
  await wait(450);
  closeSheet();
  comfort(feeling.mood);
}

// Eat the paper, then stay: validate, support, ask what would help.
async function comfort(mood) {
  pet.busy('comfort');
  pet.setState('eat', 2600);
  pet.say(phrase('vent'), 2600);
  await wait(2800);
  const set = PHRASES.comfort[mood] || PHRASES.comfort.general;
  pet.setState('sit', 60000);
  await pet.say(pick(set.validate, { owner: S.owner || 'bạn', name: S.name }), 5000);
  await pet.say(pick(set.support, { owner: S.owner || 'bạn', name: S.name }), 5500);
  care('vent');
  const c = await pet.say(phrase('comfortAsk'), 30000, [['hug', '🤗 Ôm bé'], ['breathe', '🌬️ Thở cùng bé'], ['sit', 'Ngồi đây thôi']]);
  pet.busy(null);
  if (c === 'hug') { pet.setState('happy', 4000); pet.hearts(6, '💛'); pet.say(phrase('comfortHug'), 5000); }
  else if (c === 'breathe') breathe();
  else { pet.setState('sit', 60000); pet.say(phrase('comfortSit'), 5000); }
}

// ---------- sheets ----------
let openSheetEl = null;
function openSheet(id) {
  closeSheet();
  openSheetEl = $(id);
  $('scrim').classList.remove('hidden');
  openSheetEl.classList.add('open');
  openSheetEl.setAttribute('aria-hidden', 'false');
}
function closeSheet() {
  if (!openSheetEl) return;
  if (openSheetEl.id === 'settings') applySettingsForm();
  openSheetEl.classList.remove('open');
  openSheetEl.setAttribute('aria-hidden', 'true');
  openSheetEl = null;
  $('scrim').classList.add('hidden');
}
$('scrim').addEventListener('click', closeSheet);
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeSheet));

// ---------- dock ----------
$('dock').addEventListener('click', (e) => {
  const b = e.target.closest('[data-do]');
  if (!b) return;
  const act = b.dataset.do;
  if (act === 'water') drinkWater();
  else if (act === 'stretch') doStretch();
  else if (act === 'breathe') breathe();
  else if (act === 'vent') { resetVent(); openSheet('vent'); setTimeout(() => ventText.focus(), 350); }
  else if (act === 'focus') { if (S.focusEndsAt) endFocus(false); else startFocus(); }
  else if (act === 'feed') feed();
  else if (act === 'overlay') toggleOverlay();
});

// ---------- settings ----------
function fillSettings() {
  $('curPet').innerHTML = `<img src="${petSrc(S.petId, isBaby(), 'idle')}" alt=""><span></span>`;
  $('curPet').querySelector('span').textContent = labelOf(S.petId);
  $('setName').value = S.name;
  $('setOwner').value = S.owner;
  for (const b of $('setAge').children) b.classList.toggle('on', b.dataset.v === S.ageMode);
  const growing = S.ageMode === 'grow' && !S.grown;
  $('growText').textContent = growing
    ? `Bé đang lớn: ${Math.round((S.care.points / GROW_AT) * 100)}%. Mỗi lần bạn uống nước, vươn vai, thở chậm, đập tay với bé… là bé lớn thêm một chút 🌱`
    : S.ageMode === 'grow' ? 'Bé đã lớn rồi! Cảm ơn bạn đã chăm bé, và chăm cả chính mình 💛' : '';
  $('setWater').checked = S.reminders.water;
  $('setWaterMin').value = S.reminders.waterMin;
  $('setRest').checked = S.reminders.rest;
  $('setRestMin').value = S.reminders.restMin;
  $('setChatter').checked = S.chatter;
  $('reminderHint').textContent = Native
    ? 'Bé gửi thông báo nhắc cả khi bạn không mở app.'
    : 'Trên web, bé chỉ nhắc được khi app đang mở.';
  $('overlayGroup').hidden = !Native;
  $('setOverlay').checked = !!S.overlay;
  $('appVer').textContent = PETDOCK_CONFIG.version;
}
const clampInt = (v, a, b, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : d; };
function applySettingsForm() {
  S.name = $('setName').value.trim() || S.name;
  S.owner = $('setOwner').value.trim() || S.owner;
  S.reminders = {
    water: $('setWater').checked, waterMin: clampInt($('setWaterMin').value, 10, 240, 45),
    rest: $('setRest').checked, restMin: clampInt($('setRestMin').value, 15, 240, 60),
  };
  S.chatter = $('setChatter').checked;
  save();
  showPet();
  syncOverlay();
}
$('setAge').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  S.ageMode = b.dataset.v;
  save();
  showPet();
  fillSettings();
});
$('setOverlay').addEventListener('change', () => { S.overlay = $('setOverlay').checked; save(); syncOverlay(); });
$('openSettings').addEventListener('click', () => { fillSettings(); openSheet('settings'); });
$('petName').addEventListener('click', () => { fillSettings(); openSheet('settings'); });
$('changePet').addEventListener('click', () => { closeSheet(); startWelcome('choose'); });

// ---------- welcome ----------
let chosen = null;
function go(step) {
  for (const s of document.querySelectorAll('#welcome .step')) s.classList.toggle('on', s.dataset.step === step);
  $('welcome').scrollTop = 0;
  if (step === 'choose') renderPicks();
  if (step === 'meet') showMeet();
}
document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));

function startWelcome(step = 'owner') {
  $('welcome').classList.remove('hidden');
  $('heroPets').innerHTML = ['cat-orange', 'dog-shiba', 'cat-white'].map((id) => `<img src="${petSrc(id, true, 'happy')}" alt="">`).join('');
  $('ownerInput').value = S.owner;
  renderOwnerChips();
  go(step);
}
const OWNER_CHIPS = ['Sen', 'Ba', 'Mẹ', 'Boss', 'Anh', 'Chị', 'Bạn'];
function renderOwnerChips() {
  $('ownerChips').innerHTML = OWNER_CHIPS.map((c) => `<button type="button" class="${c === $('ownerInput').value ? 'on' : ''}">${c}</button>`).join('');
}
$('ownerChips').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  $('ownerInput').value = b.textContent;
  renderOwnerChips();
});
$('ownerInput').addEventListener('input', renderOwnerChips);
$('toChoose').addEventListener('click', () => { S.owner = $('ownerInput').value.trim() || 'Sen'; go('choose'); });

function renderPicks() {
  $('chooseLead').textContent = `Các bé đang tranh nhau được ${S.owner || 'bạn'} đón về đó!`;
  const order = Object.keys(INTRO);
  const rank = (id) => (order.includes(id) ? order.indexOf(id) : 1000);
  const ids = Object.keys(REAL_PETS.pets).sort((a, b) => rank(a) - rank(b));
  $('pickGrid').innerHTML = ids.map((id) =>
    `<button type="button" class="pick" data-id="${id}"><img src="${petSrc(id, !!REAL_PETS.pets[id].baby, 'idle')}" alt="" loading="lazy"><span></span>${REAL_PETS.pets[id].online ? '<span class="new">Mới</span>' : ''}</button>`).join('');
  $('pickGrid').querySelectorAll('.pick').forEach((b) => { b.querySelector('span').textContent = labelOf(b.dataset.id); });
}
$('pickGrid').addEventListener('click', (e) => {
  const b = e.target.closest('.pick');
  if (!b) return;
  chosen = b.dataset.id;
  go('meet');
});

let meetTimer = null;
function showMeet() {
  const [name, pitch] = introOf(chosen);
  const baby = !!REAL_PETS.pets[chosen].baby;
  const poses = baby ? REAL_PETS.pets[chosen].baby.poses : REAL_PETS.pets[chosen].poses;
  const frames = ['walk-1', 'walk-2', 'walk-3', 'walk-4'].filter((k) => poses[k]);
  $('meetTitle').textContent = `Chào ${S.owner || 'bạn'}, em là ${labelOf(chosen).toLowerCase()} nè!`;
  $('meetPitch').textContent = '“' + pitch.replaceAll('{owner}', S.owner || 'bạn') + '”';
  $('babyNote').classList.toggle('hidden', !baby);
  $('petNameInput').value = name;
  let i = 0;
  clearInterval(meetTimer);
  $('meetImg').src = petSrc(chosen, baby, 'happy');
  setTimeout(() => {
    meetTimer = setInterval(() => { $('meetImg').src = petSrc(chosen, baby, frames[i++ % frames.length]); }, 170);
  }, 1200);
}
$('adopt').addEventListener('click', () => {
  clearInterval(meetTimer);
  const first = !S.onboarded;
  S.petId = chosen;
  S.name = $('petNameInput').value.trim() || introOf(chosen)[0];
  if (first || S.ageMode === 'grow') { S.grown = false; S.care = { points: 0, last: {} }; }
  S.onboarded = true;
  save();
  $('welcome').classList.add('hidden');
  showPet();
  syncOverlay();
  pet.st.x = -pet.st.W;
  pet.walkTo(pet.center(), () => { pet.setState('happy', 2500); pet.hearts(4); pet.say(phrase('hello'), 4000); });
  maybeInstallTip();
});
$('chooseStore').addEventListener('click', () => { openStore(); });

// ---------- Nhà các bé ----------
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const kb = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
let storePets = [];
function storeCard(p, extra = '') {
  let action;
  if (p.status === 'installed') action = `<button class="btn primary" data-act="choose">Chọn bé này</button>`;
  else if (p.status === 'update') action = `<button class="btn primary" data-act="install">✨ Cập nhật ảnh</button>`;
  else if (p.status === 'needs-app') action = `<button class="btn" disabled>Cần bản mới hơn</button>`;
  else action = `<button class="btn primary" data-act="install">Đón về · ${kb(p.size)}</button>`;
  return `<div class="scard" data-key="${esc(p.key)}"><div class="pic"><img src="${esc(p.thumb)}" alt="" loading="lazy"></div>
    <b>${esc(p.label)}</b><p>${esc(p.blurb || '')}</p>${extra || action}</div>`;
}
async function openStore() {
  openSheet('store');
  $('storeGrid').innerHTML = '';
  $('storeEmpty').classList.remove('hidden');
  $('storeEmpty').innerHTML = '<span class="big">🐾</span>Đang gõ cửa nhà các bé…';
  const cat = await PetStore.catalog();
  if (!cat.ok) {
    $('storeEmpty').innerHTML = cat.reason === 'off'
      ? '<span class="big">🏗️</span>Nhà các bé đang được xây, chưa mở cửa đâu.'
      : '<span class="big">📡</span>Chưa kết nối được. Kiểm tra mạng rồi thử lại nha.';
    return;
  }
  storePets = cat.pets;
  $('storeEmpty').classList.toggle('hidden', storePets.length > 0);
  $('storeEmpty').innerHTML = '<span class="big">🧺</span>Các bạn mới đang trên đường tới, sắp có rồi nè.';
  $('storeGrid').innerHTML = storePets.map((p) => storeCard(p)).join('');
}
$('openStore').addEventListener('click', openStore);
$('storeGrid').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const card = b.closest('.scard');
  const p = storePets.find((x) => x.key === card.dataset.key);
  if (b.dataset.act === 'install') {
    card.outerHTML = storeCard(p, '<div class="bar"><i></i></div>');
    const bar = () => document.querySelector(`.scard[data-key="${p.key}"] .bar i`);
    const res = await PetStore.install(p, (got, total) => { const i = bar(); if (i && total) i.style.width = Math.round((got / total) * 100) + '%'; });
    if (res.ok) { p.status = 'installed'; await PetStore.mergeInstalled(); }
    const msg = res.ok ? `<p>${esc(p.label)} đã về nhà 🏡</p>` : `<p>${res.reason === 'checksum' ? 'Gói bị lỗi khi tải nên bé không mở. Thử lại sau nha.' : 'Chưa tải được, thử lại nha.'}</p>`;
    document.querySelector(`.scard[data-key="${p.key}"]`).outerHTML = storeCard(p).replace('</b>', '</b>' + msg);
  } else if (b.dataset.act === 'choose') {
    closeSheet();
    chosen = p.key;
    if (!$('welcome').classList.contains('hidden')) { go('meet'); return; }
    startWelcome('meet');
  }
});

// ---------- Android: pet outside the app ----------
function syncOverlay() {
  if (!Native) return;
  $('overlayBtn').classList.remove('hidden');
  if (!S.overlay || !S.onboarded) { Native.stopOverlay(); return; }
  if (!Native.canOverlay()) { Native.requestOverlay(); return; }
  const baby = isBaby();
  const e = REAL_PETS.pets[S.petId];
  const poses = baby ? e.baby.poses : e.poses;
  const cfg = { id: S.petId, baby, name: S.name, owner: S.owner, poses, kind: kind() };
  if (e.urls) {
    // downloaded pets live in IndexedDB: hand the images over as data URLs
    Promise.all(Object.keys(poses).map(async (k) => {
      const blob = await (await fetch(petSrc(S.petId, baby, k))).blob();
      return [k, await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); })];
    })).then((pairs) => Native.startOverlay(JSON.stringify({ ...cfg, images: Object.fromEntries(pairs) })));
  } else Native.startOverlay(JSON.stringify({ ...cfg, assetDir: `pets/${S.petId}${baby ? '/baby' : ''}` }));
}
function toggleOverlay() {
  S.overlay = !S.overlay;
  save();
  syncOverlay();
  pet.say(S.overlay ? 'Để em ra ngoài đi dạo với ' + (S.owner || 'bạn') + ' nha! 🐾' : 'Em vào nhà rồi nè~', 3000);
}
// called by the Android app when permission comes back
window.petdockOverlayGranted = () => syncOverlay();
window.petdockAction = (a) => {
  if (a === 'water') drinkWater();
  else if (a === 'stretch') doStretch();
  else if (a === 'vent') { resetVent(); openSheet('vent'); }
  else if (a === 'breathe') breathe();
  else if (a === 'focusdone') focusTick();
};

// ---------- Android: a newer APK on the site (checked once a day) ----------
async function checkAndroidUpdate() {
  if (!Native || !PETDOCK_CONFIG.onlineBase) return;
  const last = +(localStorage.getItem('petdock-update-check') || 0);
  if (Date.now() - last < 24 * 3600e3) return;
  try {
    localStorage.setItem('petdock-update-check', String(Date.now()));
    const l = await (await fetch(new URL('latest.json', PETDOCK_CONFIG.onlineBase), { cache: 'no-cache' })).json();
    const newer = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };
    if (!l.android || !/^https:\/\//.test(l.android.url || '') || !newer(String(l.version), PETDOCK_CONFIG.version)) return;
    if (localStorage.getItem('petdock-skip') === l.version) return;
    const c = await pet.say(phrase('onlineUpdate', { version: l.version }), 30000, [['get', '🎁 Tải bản mới'], ['skip', 'Bỏ qua bản này'], ['later', 'Để sau']]);
    if (c === 'get') location.href = l.android.url; // opens in the browser, which downloads the APK
    else if (c === 'skip') localStorage.setItem('petdock-skip', l.version);
  } catch { /* offline: try again tomorrow */ }
}

// ---------- iPhone: suggest "Add to Home Screen" ----------
function maybeInstallTip() {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  $('installTip').classList.toggle('hidden', !ios || standalone || S.installTipClosed || !!Native);
}
$('installTipClose').addEventListener('click', () => { S.installTipClosed = true; save(); maybeInstallTip(); });

// ---------- start ----------
(async () => {
  // offline support from the very first visit (before the welcome steps)
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !Native) navigator.serviceWorker.register('sw.js').catch(() => {});
  await PetStore.mergeInstalled().catch(() => {});
  if (!REAL_PETS.pets[S.petId]) S.petId = 'cat-orange';
  if (!S.onboarded) { startWelcome('owner'); return; }
  showPet();
  maybeInstallTip();
  syncOverlay();
  if (S.focusEndsAt) {
    if (S.focusEndsAt > Date.now()) { $('focusBar').classList.remove('hidden'); pet.busy('focus'); pet.setState('focus'); }
    else endFocus(true);
  } else {
    setTimeout(() => { pet.setState('happy', 1500); pet.say(phrase('hello'), 3500); }, 700);
  }
  setTimeout(checkAndroidUpdate, 20000);
})();
