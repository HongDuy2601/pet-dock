// The pet on phones and tablets: it lives in a little room inside the app (iOS doesn't allow
// drawing over other apps). Same photo poses as the desktop pet, driven by touch.
//   const pet = createRoomPet(roomEl, { onTap, onHighFive, onPurr, onLand })
//   pet.load({ poses, src(pose) }); pet.say(text, ms, choices) → Promise<choice|null>

function createRoomPet(room, hooks = {}) {
  const el = document.createElement('div');
  el.className = 'rpet';
  el.innerHTML = '<div class="rpet-flip"><div class="rpet-sprite"></div></div>';
  const flip = el.firstChild;
  const sprite = flip.firstChild;
  const bubble = document.createElement('div');
  bubble.className = 'rbubble';
  room.append(el, bubble);

  const st = {
    x: 0, y: 0, vy: 0, dir: 1, W: 160, H: 120,
    state: 'idle', until: 0, target: null, onArrive: null, walkDist: 0,
    held: false, airborne: false, asleep: false, hold: null, paused: false,
    raisedPaw: null, lastTap: [], busy: null,
  };
  let set = null;          // { poses, imgs, walk }
  let shown = null;
  const now = () => performance.now();
  const rand = (a, b) => a + Math.random() * (b - a);
  const floorY = () => room.clientHeight - Math.max(18, room.clientHeight * 0.05); // feet on the rug

  function load({ poses, src, baby }) {
    const roomW = room.clientWidth || 360;
    st.W = Math.round(Math.min(roomW * (baby ? 0.34 : 0.44), baby ? 180 : 240));
    st.H = Math.round(st.W * poses.idle.h / poses.idle.w);
    const k = st.W / poses.idle.w;
    sprite.innerHTML = '';
    const imgs = {};
    for (const [name, p] of Object.entries(poses)) {
      const img = new Image();
      img.src = src(name);
      img.className = 'pose';
      img.draggable = false;
      img.decoding = 'async';
      const w = p.w * k, h = p.h * k;
      Object.assign(img.style, { width: w + 'px', height: h + 'px', left: (st.W - w) / 2 + 'px' });
      if (name === 'held') img.style.top = -st.H * 0.15 + 'px';
      else img.style.bottom = '0px';
      sprite.appendChild(img);
      imgs[name] = img;
    }
    set = { poses, imgs, walk: ['walk-1', 'walk-2', 'walk-3', 'walk-4'].filter((n) => poses[n]) };
    shown = null;
    el.style.width = st.W + 'px';
    el.style.height = st.H + 'px';
    if (!st.x) st.x = roomW * 0.5;
    st.y = floorY();
    draw();
  }

  // ---------- states ----------
  function setState(s, ms = 0) {
    st.state = s;
    st.until = ms ? now() + ms : 0;
    if (s !== 'walk') { st.target = null; }
    st.asleep = s === 'sleep';
    el.dataset.state = s;
  }

  function walkTo(x, onArrive) {
    const pad = st.W * 0.5 + 6;
    st.target = Math.max(pad, Math.min(room.clientWidth - pad, x));
    st.onArrive = onArrive || null;
    setState('walk');
    st.target = Math.max(pad, Math.min(room.clientWidth - pad, x));
  }

  function pose() {
    const has = (k) => (set.poses[k] ? k : 'idle');
    if (st.held) return has('held');
    if (st.airborne) return set.walk[2] || 'idle';
    switch (st.state) {
      case 'walk': return set.walk.length ? set.walk[Math.floor(st.walkDist / (st.W * 0.11)) % set.walk.length] : 'idle';
      case 'sit': case 'breathe': return has('sit');
      case 'sleep': case 'focus': return has('sleep');
      case 'happy': return has('happy');
      case 'eat': return has('eat');
      case 'stretch': return has('stretch');
      case 'yawn': return set.poses.yawn ? 'yawn' : has('sit');
      case 'highfive': return set.poses['high-five'] ? 'high-five' : has('happy');
      default: return 'idle';
    }
  }

  // Pure CSS motion for poses a pet doesn't have (e.g. no yawn photo).
  function draw() {
    if (!set) return;
    el.style.transform = `translate(${st.x - st.W / 2}px, ${st.y - st.H}px)`;
    flip.style.transform = st.dir < 0 ? 'scaleX(-1)' : '';
    const p = pose();
    if (p !== shown) {
      if (shown && set.imgs[shown]) set.imgs[shown].classList.remove('on');
      set.imgs[p].classList.add('on');
      shown = p;
    }
    el.classList.toggle('synth-yawn', st.state === 'yawn' && !set.poses.yawn);
    el.classList.toggle('synth-stretch', st.state === 'stretch' && !set.poses.stretch);
    el.classList.toggle('breathing', st.state === 'breathe');
    placeBubble();
  }

  function step(dt) {
    if (!set || st.paused) return;
    const fy = floorY();
    if (st.held) { draw(); return; }
    if (st.airborne || st.y < fy - 0.5) {
      st.airborne = true;
      st.vy += 2600 * dt;
      st.y += st.vy * dt;
      if (st.y >= fy) {
        st.y = fy; st.vy = 0; st.airborne = false;
        if (hooks.onLand) hooks.onLand();
      }
    } else st.y = fy;
    if (st.state === 'walk' && st.target != null) {
      const speed = st.W * 0.75;
      const d = st.target - st.x;
      st.dir = d < 0 ? -1 : 1;
      const m = Math.min(Math.abs(d), speed * dt);
      st.x += Math.sign(d) * m;
      st.walkDist += m;
      if (Math.abs(d) < 1) {
        const cb = st.onArrive;
        st.onArrive = null;
        setState('idle', 1500);
        if (cb) cb();
      }
    } else if (st.until && now() > st.until) {
      if (st.state === 'highfive' && st.raisedPaw) { const r = st.raisedPaw; st.raisedPaw = null; r(false); }
      setState('idle');
    }
    draw();
  }

  // Idle wandering; the app can pause it (breathing, focus, comfort).
  function think() {
    if (!set || st.held || st.airborne || st.busy || st.paused) return;
    if (st.state !== 'idle' || (st.until && now() < st.until)) return;
    const r = Math.random();
    if (r < 0.42) walkTo(rand(st.W, room.clientWidth - st.W));
    else if (r < 0.62) setState('sit', rand(6000, 14000));
    else if (r < 0.72) setState('yawn', 2400);
    else if (r < 0.8) setState('stretch', 2600);
    else if (r < 0.9) setState('sleep', rand(12000, 30000));
    else setState('idle', rand(3000, 6000));
  }

  // ---------- bubble ----------
  let bubbleTimer = null, bubbleResolve = null;
  function say(text, ms = 4500, choices = null) {
    if (bubbleResolve) { bubbleResolve(null); bubbleResolve = null; }
    clearTimeout(bubbleTimer);
    bubble.textContent = text;
    bubble.classList.toggle('choices', !!choices);
    const p = new Promise((resolve) => { bubbleResolve = resolve; });
    if (choices) {
      const row = document.createElement('div');
      row.className = 'rchoices';
      for (const [value, label] of choices) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          hideBubble();
          const r = bubbleResolve; bubbleResolve = null;
          if (r) r(value);
        });
        row.appendChild(b);
      }
      bubble.appendChild(row);
    }
    bubble.classList.add('show');
    placeBubble();
    bubbleTimer = setTimeout(() => { hideBubble(); if (bubbleResolve) { bubbleResolve(null); bubbleResolve = null; } }, ms);
    return p;
  }
  function hideBubble() { bubble.classList.remove('show', 'choices'); }
  function placeBubble() {
    if (!bubble.classList.contains('show')) return;
    const bw = bubble.offsetWidth, rw = room.clientWidth;
    const img = set && shown ? set.imgs[shown] : null;
    const top = img ? st.y - img.offsetHeight - (shown === 'held' ? st.H * 0.15 : 0) : st.y - st.H;
    const left = Math.max(10, Math.min(rw - bw - 10, st.x - bw / 2));
    bubble.style.transform = `translate(${left}px, ${Math.max(8, top - bubble.offsetHeight - 10)}px)`;
    bubble.style.setProperty('--tail', Math.max(16, Math.min(bw - 16, st.x - left)) + 'px');
  }

  function hearts(n = 3, emoji = '💕') {
    for (let i = 0; i < n; i++) {
      const h = document.createElement('span');
      h.className = 'rheart';
      h.textContent = emoji;
      h.style.left = st.x + rand(-st.W * 0.3, st.W * 0.3) + 'px';
      h.style.top = st.y - st.H * rand(0.6, 1) + 'px';
      h.style.animationDelay = i * 0.12 + 's';
      room.appendChild(h);
      setTimeout(() => h.remove(), 1600 + i * 120);
    }
  }

  function jump(v = 700) { st.vy = -v; st.y -= 1; st.airborne = true; }

  // Sit up with a paw raised; resolves true when the person taps the paw.
  function raisePaw(ms = 15000) {
    return new Promise((resolve) => {
      if (st.raisedPaw) st.raisedPaw(false);
      st.raisedPaw = resolve;
      setState('highfive', ms);
    });
  }

  // ---------- touch ----------
  let press = null;
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    press = { x0: e.clientX, y0: e.clientY, t: now(), moved: false, strokes: 0, lastX: e.clientX, dirX: 0 };
    const r = room.getBoundingClientRect();
    press.offX = e.clientX - r.left - st.x;
    press.offY = e.clientY - r.top - st.y;
  });
  el.addEventListener('pointermove', (e) => {
    if (!press) return;
    const dx = e.clientX - press.x0, dy = e.clientY - press.y0;
    if (!press.moved && Math.hypot(dx, dy) > 12) {
      press.moved = true;
      // a mostly-sideways rub while the pet is on the floor = petting; otherwise pick it up
      press.rub = Math.abs(dx) > Math.abs(dy) * 2 && !st.airborne && Math.abs(dy) < 14;
      if (!press.rub) {
        st.held = true;
        st.busy = null;
        hideBubble();
        if (st.raisedPaw) { const r = st.raisedPaw; st.raisedPaw = null; r(false); }
        if (hooks.onPickUp) hooks.onPickUp();
      }
    }
    if (press.rub) {
      const d = Math.sign(e.clientX - press.lastX);
      if (d && d !== press.dirX) { press.strokes++; press.dirX = d; }
      press.lastX = e.clientX;
      if (press.strokes === 4 && hooks.onPurr) hooks.onPurr();
    } else if (st.held) {
      const r = room.getBoundingClientRect();
      st.x = Math.max(st.W / 2, Math.min(room.clientWidth - st.W / 2, e.clientX - r.left - press.offX));
      st.y = Math.max(st.H, Math.min(floorY(), e.clientY - r.top - press.offY));
      draw();
    }
  });
  const release = () => {
    if (!press) return;
    const p = press;
    press = null;
    if (st.held) { st.held = false; st.vy = 0; st.airborne = true; setState('idle', 1200); return; }
    if (p.moved) return;
    // tap on the raised paw = high-five
    if (st.raisedPaw) { const r = st.raisedPaw; st.raisedPaw = null; setState('happy', 2200); r(true); return; }
    const t = now();
    st.lastTap = st.lastTap.filter((x) => t - x < 900).concat(t);
    if (st.lastTap.length >= 3) { st.lastTap = []; if (hooks.onTripleTap) hooks.onTripleTap(); return; }
    if (hooks.onTap) hooks.onTap();
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);

  // ---------- loop ----------
  let last = now();
  function frame() {
    const t = now();
    step(Math.min(0.05, (t - last) / 1000));
    last = t;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  setInterval(think, 2500);
  addEventListener('resize', () => { st.y = floorY(); st.x = Math.min(st.x, room.clientWidth - st.W / 2); draw(); });

  return {
    el, st, step, load, setState, walkTo, say, hideBubble, hearts, jump, raisePaw,
    get state() { return st.state; },
    busy(tag) { st.busy = tag; },
    pause(on) { st.paused = on; if (!on) last = now(); },
    center() { return room.clientWidth / 2; },
  };
}
