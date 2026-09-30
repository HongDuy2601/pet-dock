// Crumpled-paper helpers shared by the vent window and the pet window.

function seededRandom(seed) {
  let a = Math.floor(seed * 2 ** 31) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A faceted paper ball: jagged outline, light/shadow creases, scraps of ruled lines.
function paperBallSVG(size = 40, seed = Math.random()) {
  const rnd = seededRandom(seed);
  const n = 13;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.35;
    const r = 17 + rnd() * 5 * (i % 2 ? 1 : 0.55);
    pts.push([25 + Math.cos(a) * r, 25 + Math.sin(a) * r]);
  }
  // off-centre "peak" makes the facets read as a crumpled 3D lump lit from the top-left
  const peak = [22 + rnd() * 4, 21 + rnd() * 4];
  const litShades = ['#FFFFFF', '#FAF8F2', '#F4F0E6'];
  const shadeShades = ['#E9E3D6', '#E0D9CA', '#D6CEBC'];
  const tri = (a, b, c) => {
    const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3;
    const lit = (peak[0] + 4 - cx) + (peak[1] + 4 - cy) + (rnd() - 0.5) * 6 > 0; // faces the top-left light
    const fill = (lit ? litShades : shadeShades)[Math.floor(rnd() * 3)];
    const f = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    return `<path d="M${f(a)}L${f(b)}L${f(c)}Z" fill="${fill}" stroke="${fill}" stroke-width=".3"/>`;
  };
  let facets = '';
  for (let i = 0; i < n; i++) {
    const p1 = pts[i], p2 = pts[(i + 1) % n];
    // a buckled ridge point part-way to the peak splits each wedge into three creased faces
    const t = 0.45 + rnd() * 0.25;
    const ridge = [
      peak[0] + ((p1[0] + p2[0]) / 2 - peak[0]) * t + (rnd() - 0.5) * 4,
      peak[1] + ((p1[1] + p2[1]) / 2 - peak[1]) * t + (rnd() - 0.5) * 4,
    ];
    facets += tri(peak, p1, ridge) + tri(peak, ridge, p2) + tri(ridge, p1, p2);
  }
  let creases = '';
  for (let i = 0; i < 5; i++) {
    const [x, y] = pts[Math.floor(rnd() * n)];
    const bx = peak[0] + (x - peak[0]) * (0.3 + rnd() * 0.3), by = peak[1] + (y - peak[1]) * (0.3 + rnd() * 0.3);
    creases += `<path d="M${bx.toFixed(1)} ${by.toFixed(1)}L${(bx + (rnd() - 0.5) * 12).toFixed(1)} ${(by + (rnd() - 0.5) * 12).toFixed(1)}" stroke="#C9C0AE" stroke-width=".6" stroke-linecap="round"/>`;
  }
  let lines = '';
  for (let i = 0; i < 3; i++) {
    const y = 16 + i * 8 + rnd() * 3, x = 12 + rnd() * 8, len = 8 + rnd() * 12, tilt = (rnd() - 0.5) * 8;
    lines += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}l${len.toFixed(1)} ${tilt.toFixed(1)}" stroke="#9FB9DA" stroke-width=".9" opacity=".7"/>`;
  }
  const poly = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const id = 'pb' + Math.floor(seed * 1e9);
  return `<svg class="paperball" width="${size}" height="${size}" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
  <defs><clipPath id="${id}"><polygon points="${poly}"/></clipPath></defs>
  <g clip-path="url(#${id})">${facets}${lines}${creases}</g>
  <polygon points="${poly}" fill="none" stroke="#BDB39F" stroke-width=".8" stroke-linejoin="round"/>
</svg>`;
}

// Soft paper-crackle, synthesised so there is no audio file to ship.
function crackle(ctx, when, duration = 0.18, gain = 0.05) {
  const len = Math.floor(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const env = Math.random() < 0.06 ? 1 : 0.25;          // sparse sharp crinkles
    d[i] = (Math.random() * 2 - 1) * env * (1 - i / len);
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1800;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(hp).connect(g).connect(ctx.destination);
  src.start(when);
}
