// Nhà các bé on phones: same catalog and .pdpet packs as the desktop app.
// Packs are checked (size, SHA-256, format, WebP only) and kept in IndexedDB on this device.

const PetStore = (() => {
  const REQUIRED = ['idle', 'walk-1', 'walk-2', 'walk-3', 'walk-4', 'sit', 'sleep', 'happy', 'eat', 'held'];
  const OPTIONAL = ['stretch', 'yawn', 'high-five', 'carry-1', 'carry-2', 'carry-3', 'carry-4', 'push-1', 'push-2', 'present'];
  const KNOWN = new Set([...REQUIRED, ...OPTIONAL]);
  const ID = /^[a-z][a-z0-9]{1,23}$/;
  const MAX_PACK = 40 * 1024 * 1024;
  const clean = (t, n) => String(t == null ? '' : t).replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, n);
  const intIn = (v, a, b) => Number.isInteger(v) && v >= a && v <= b;

  // Where the catalog lives: next to this app on GitHub Pages, or the configured site inside the Android app.
  const base = () => (window.PETDOCK_CONFIG && PETDOCK_CONFIG.onlineBase) || null;

  // ---------- IndexedDB ----------
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open('petdock', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('pets', { keyPath: 'key' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }
  async function tx(mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const t = d.transaction('pets', mode);
      const r = fn(t.objectStore('pets'));
      t.oncomplete = () => resolve(r && r.result);
      t.onerror = () => reject(t.error);
    });
  }
  const all = () => tx('readonly', (s) => s.getAll()).catch(() => []);

  // ---------- validation (mirrors online.js on desktop) ----------
  function checkPoses(poses) {
    if (!poses || typeof poses !== 'object') throw new Error('bad-poses');
    for (const k of REQUIRED) if (!poses[k]) throw new Error('missing-' + k);
    const out = {};
    for (const [k, p] of Object.entries(poses)) {
      if (!KNOWN.has(k)) throw new Error('unknown-pose');
      if (!p || !intIn(p.w, 8, 2000) || !intIn(p.h, 8, 2000)) throw new Error('bad-size');
      out[k] = { w: p.w, h: p.h };
    }
    return out;
  }
  const isWebp = (b) => b.length > 16 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP';
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

  async function readPack(bytes) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const pack = JSON.parse(await new Response(stream).text());
    if (pack.format !== 'petdock-pet-v1' || !ID.test(pack.type) || !ID.test(pack.variant)) throw new Error('bad-format');
    const key = `${pack.type}-${pack.variant}`;
    if (typeof BUILTIN_REAL !== 'undefined' && BUILTIN_REAL.has(key)) throw new Error('builtin');
    const meta = {
      key, type: pack.type, variant: pack.variant,
      typeLabel: clean(pack.typeLabel, 20) || pack.type, typeEmoji: clean(pack.typeEmoji, 4),
      label: clean(pack.label, 30) || key, name: clean(pack.name, 20), blurb: clean(pack.blurb, 160),
      version: clean(pack.version, 12) || '1',
      poses: checkPoses(pack.poses), baby: pack.baby ? { poses: checkPoses(pack.baby.poses) } : null,
    };
    const images = {};
    const want = [...Object.keys(meta.poses), ...(meta.baby ? Object.keys(meta.baby.poses).map((k) => 'baby/' + k) : [])];
    for (const name of want) {
      if (typeof pack.images?.[name] !== 'string') throw new Error('missing-image');
      const img = b64(pack.images[name]);
      if (img.length > 3 * 1024 * 1024 || !isWebp(img)) throw new Error('bad-image');
      images[name] = new Blob([img], { type: 'image/webp' });
    }
    return { ...meta, images };
  }

  function cmp(a, b) {
    const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
    for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
    return 0;
  }

  // ---------- public ----------
  async function catalog() {
    const b = base();
    if (!b) return { ok: false, reason: 'off' };
    try {
      const r = await fetch(new URL('catalog.json', b), { cache: 'no-cache' });
      const raw = await r.json();
      if (raw.format !== 'petdock-catalog-v1' || !Array.isArray(raw.pets)) return { ok: false, reason: 'bad' };
      const have = new Map((await all()).map((p) => [p.key, p]));
      const pets = raw.pets.filter((p) => ID.test(p.type) && ID.test(p.variant) && /^[0-9a-f]{64}$/.test(p.sha256 || '')).map((p) => {
        const key = `${p.type}-${p.variant}`;
        const mine = have.get(key);
        let status = 'new';
        if (cmp(PETDOCK_CONFIG.version, p.minApp || '0') < 0) status = 'needs-app';
        else if (mine) status = cmp(p.version, mine.version) > 0 ? 'update' : 'installed';
        return {
          key, type: p.type, variant: p.variant, label: clean(p.label, 30), name: clean(p.name, 20), blurb: clean(p.blurb, 160),
          typeLabel: clean(p.typeLabel, 20), typeEmoji: clean(p.typeEmoji, 4), version: clean(p.version, 12),
          size: +p.size || 0, sha256: p.sha256, pack: String(p.pack), thumb: new URL(String(p.thumb), b).href, baby: !!p.baby, status,
        };
      }).filter((p) => typeof BUILTIN_REAL === 'undefined' || !BUILTIN_REAL.has(p.key));
      return { ok: true, pets };
    } catch {
      return { ok: false, reason: 'offline' };
    }
  }

  async function install(entry, onProgress) {
    try {
      const url = new URL(entry.pack, base());
      if (url.origin !== new URL(base()).origin) return { ok: false, reason: 'invalid' };
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) return { ok: false, reason: 'offline' };
      const reader = res.body.getReader();
      const parts = [];
      let got = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        got += value.length;
        if (got > MAX_PACK) { reader.cancel(); return { ok: false, reason: 'invalid' }; }
        parts.push(value);
        if (onProgress) onProgress(got, entry.size);
      }
      const bytes = new Uint8Array(got);
      let o = 0;
      for (const p of parts) { bytes.set(p, o); o += p.length; }
      if (hex(await crypto.subtle.digest('SHA-256', bytes)) !== entry.sha256) return { ok: false, reason: 'checksum' };
      const pet = await readPack(bytes);
      if (pet.key !== entry.key) return { ok: false, reason: 'invalid' };
      await tx('readwrite', (s) => s.put(pet));
      return { ok: true, pet };
    } catch (e) {
      return { ok: false, reason: /bad|missing|unknown|builtin/.test(e.message) ? 'invalid' : 'offline' };
    }
  }

  const remove = (key) => tx('readwrite', (s) => s.delete(key));

  // Merge downloaded pets into REAL_PETS / PETS with blob URLs, like realpets.js does on desktop.
  const urls = new Map();
  async function mergeInstalled() {
    const list = await all();
    for (const p of list) {
      const u = {};
      for (const [name, blob] of Object.entries(p.images)) u[name] = urls.get(p.key + name) || URL.createObjectURL(blob);
      for (const [name, url] of Object.entries(u)) urls.set(p.key + name, url);
      REAL_PETS.pets[p.key] = { poses: p.poses, baby: p.baby || undefined, urls: u, online: true };
      if (!PETS[p.type]) PETS[p.type] = { label: p.typeLabel, emoji: p.typeEmoji || '🐾', photoOnly: true, online: true, variants: {} };
      PETS[p.type].variants[p.variant] = { label: p.label, name: p.name, online: true };
    }
    return list;
  }

  return { catalog, install, remove, mergeInstalled, enabled: () => !!base() };
})();
