// Vector pets. Every pet is drawn facing right in a 120x100 viewBox,
// feet touching y=96. Group class names are the hooks pet.css animates.

const PETS = {
  cat: {
    label: 'Mèo',
    variants: {
      orange:  { label: 'Mèo cam',       fur: '#F2A65A', dark: '#D07A2A', belly: '#FFE8CC', ear: '#F6B3A0', eye: '#2B2320', pattern: 'tabby' },
      gray:    { label: 'Mèo mướp xám',  fur: '#A7ADB4', dark: '#6C737B', belly: '#EEF0F2', ear: '#F2B5B5', eye: '#2B2B2B', pattern: 'tabby' },
      black:   { label: 'Mèo mun',       fur: '#2E2D33', dark: '#1B1A1F', belly: '#3E3D45', ear: '#9A6470', eye: '#F0CF45', pattern: 'solid' },
      white:   { label: 'Mèo trắng',     fur: '#FBFAF7', dark: '#E2DDD4', belly: '#FFFFFF', ear: '#F7B9B9', eye: '#4AA3D8', pattern: 'solid' },
      calico:  { label: 'Mèo tam thể',   fur: '#FBF6EE', dark: '#E08A3C', patch: '#3B3230', belly: '#FFFFFF', ear: '#F4B2A8', eye: '#3F7A3A', pattern: 'calico' },
      siamese: { label: 'Mèo Xiêm',      fur: '#F0E4D0', dark: '#574034', belly: '#FAF3E8', ear: '#574034', eye: '#3C8FD6', pattern: 'points' },
      heart:   { label: 'Mèo Trái Tim',  fur: '#FBFAF7', dark: '#1F1E22', belly: '#FFFFFF', ear: '#F4B6B6', eye: '#8DBA4B', pattern: 'heart' },
    },
  },
  dog: {
    label: 'Chó',
    variants: {
      corgi:  { label: 'Corgi',        fur: '#E39B4E', dark: '#C0762B', belly: '#FFF6EA', eye: '#2A211C', ears: 'pointy', legs: 'short' },
      shiba:  { label: 'Shiba',        fur: '#DC8E48', dark: '#B96E2C', belly: '#FFF3E2', eye: '#2A211C', ears: 'pointy' },
      golden: { label: 'Golden',       fur: '#E9C07A', dark: '#C99A4E', belly: '#F8E3BA', eye: '#2A211C', ears: 'floppy' },
      muc:    { label: 'Chó mực',      fur: '#2F2B29', dark: '#1D1A19', belly: '#4A4441', eye: '#1A1A1A', ears: 'floppy', eyeRing: '#7A6A60' },
      vang:   { label: 'Chó vàng ta',  fur: '#D9A35E', dark: '#B07E3E', belly: '#F4DDB5', eye: '#2A211C', ears: 'pointy' },
      poodle: { label: 'Poodle trắng', fur: '#FAF6F1', dark: '#E6DDD2', belly: '#FFFFFF', eye: '#2A211C', ears: 'floppy', fluffy: true },
    },
  },
};

// Photo-only species (no cartoon drawing yet).
PETS.pig = {
  label: 'Heo',
  photoOnly: true,
  variants: {
    pink: { label: 'Heo hồng', fur: '#F4B8C0', dark: '#E48A9A', belly: '#FBD3D9', ear: '#E48A9A', eye: '#2B2320' },
  },
};

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amt));
  const r = c(n >> 16), g = c((n >> 8) & 255), b = c(n & 255);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

// Coloured irises get a slit pupil; near-black eyes don't need one.
function isLight(hex) {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) + ((n >> 8) & 255) + (n & 255)) / 3 > 70;
}

function eyes(p, cx1, cx2, cy) {
  const pupil = '#16120F';
  const one = (cx) => `
    <ellipse cx="${cx}" cy="${cy}" rx="2.9" ry="3.6" fill="${p.eye}"/>
    ${isLight(p.eye) ? `<ellipse cx="${cx + 0.4}" cy="${cy}" rx="1.3" ry="2.9" fill="${pupil}"/>` : ''}
    <circle cx="${cx + 1}" cy="${cy - 1.3}" r="1" fill="#fff"/>`;
  const shut = (cx) => `<path d="M${cx - 3} ${cy} q3 2.6 6 0" stroke="${p.eyeLine || '#2B2320'}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  return `
    <g class="eyes-open">${one(cx1)}${one(cx2)}</g>
    <g class="eyes-closed">${shut(cx1)}${shut(cx2)}</g>`;
}

function catSVG(p) {
  const points = p.pattern === 'points';
  const legC = points ? p.dark : p.fur;
  const tailC = points ? p.dark : p.fur;
  const heart = p.pattern === 'heart';
  const earC = points || heart ? p.dark : p.fur;
  const eyeLine = p.fur === '#2E2D33' ? '#C9A43A' : '#2B2320';
  p = { ...p, eyeLine };

  let bodyPattern = '', headPattern = '', tailPattern = '';
  if (p.pattern === 'tabby') {
    bodyPattern = `
      <path d="M44 46 q3 8 0 14" stroke="${p.dark}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M54 45 q3 9 0 15" stroke="${p.dark}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M64 46 q3 8 0 13" stroke="${p.dark}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    headPattern = `
      <path d="M86 27 l1 6" stroke="${p.dark}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M91 26.5 l0 7" stroke="${p.dark}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M96 27 l-1 6" stroke="${p.dark}" stroke-width="2.2" stroke-linecap="round"/>`;
    tailPattern = `
      <path d="M13 40 l6 -1" stroke="${p.dark}" stroke-width="3" stroke-linecap="round"/>
      <path d="M14 31 l6 0" stroke="${p.dark}" stroke-width="3" stroke-linecap="round"/>`;
  } else if (p.pattern === 'calico') {
    bodyPattern = `
      <ellipse cx="42" cy="54" rx="11" ry="8" fill="${p.dark}"/>
      <ellipse cx="64" cy="50" rx="8" ry="6" fill="${p.patch}"/>`;
    headPattern = `<path d="M76 38 Q80 24 92 25 Q86 32 88 42 Q80 44 76 38Z" fill="${p.dark}"/>
      <ellipse cx="99" cy="32" rx="5" ry="4" fill="${p.patch}"/>`;
    tailPattern = `<path d="M15 34 C 12 30, 13 27, 14 26" stroke="${p.patch}" stroke-width="7" stroke-linecap="round" fill="none"/>`;
  } else if (heart) {
    // tuxedo patches, dark cap over the ears, and the little black heart on the muzzle
    bodyPattern = `
      <ellipse cx="40" cy="55" rx="13" ry="10" fill="${p.dark}"/>
      <ellipse cx="66" cy="50" rx="10" ry="7" fill="${p.dark}"/>`;
    headPattern = `<path d="M73 40 Q74 24 90 25 Q106 24 107 40 Q99 33 90 34 Q81 33 73 40Z" fill="${p.dark}"/>`;
    tailPattern = `<path d="M14 30 C 13 28, 13 27, 14 26" stroke="${p.dark}" stroke-width="7" stroke-linecap="round" fill="none"/>`;
  } else if (points) {
    headPattern = `<ellipse cx="96" cy="48" rx="11" ry="9" fill="${shade(p.dark, 30)}" opacity=".85"/>`;
  }

  return `
<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
  <g class="tail-wrap"><g class="tail">
    <path d="M32 60 C 16 58, 8 44, 14 26" stroke="${tailC}" stroke-width="7" fill="none" stroke-linecap="round"/>
    ${tailPattern}
  </g></g>
  <g class="legs-back">
    <rect class="leg lb1" x="30" y="64" width="9" height="32" rx="4.5" fill="${shade(legC, -18)}"/>
    <rect class="leg lb2" x="41" y="64" width="9" height="32" rx="4.5" fill="${legC}"/>
  </g>
  <g class="legs-front">
    <rect class="leg lf1" x="67" y="64" width="9" height="32" rx="4.5" fill="${shade(legC, -18)}"/>
    <rect class="leg lf2" x="78" y="64" width="9" height="32" rx="4.5" fill="${legC}"/>
  </g>
  <g class="torso-pose"><g class="torso">
    <ellipse cx="56" cy="62" rx="32" ry="17" fill="${p.fur}"/>
    <ellipse cx="62" cy="71" rx="20" ry="7" fill="${p.belly}"/>
    ${bodyPattern}
  </g></g>
  <g class="head-pose"><g class="head">
    <path d="M75 37 L77 14 L91 28 Z" fill="${earC}"/>
    <path d="M78.5 31 L79.5 19.5 L87 28 Z" fill="${p.ear}"/>
    <path d="M92 27 L104 13 L107 37 Z" fill="${earC}"/>
    <path d="M95.5 28 L102.5 19.5 L104 33 Z" fill="${p.ear}"/>
    <circle cx="90" cy="43" r="18" fill="${p.fur}"/>
    ${headPattern}
    <ellipse cx="97" cy="51.5" rx="8.5" ry="6" fill="${points ? shade(p.dark, 30) : p.belly}"/>
    ${heart ? `<path d="M99.5 50.5 c-1.6-2.4-5.2-1.2-4.6 1.4 c0.4 1.8 2.6 3 4.6 4.6 c2-1.6 4.2-2.8 4.6-4.6 c0.6-2.6-3-3.8-4.6-1.4z" fill="${p.dark}"/>` : ''}
    ${eyes(p, 84, 97.5, 41)}
    <ellipse cx="80" cy="49" rx="3.2" ry="2" fill="#FF8FA3" opacity=".45"/>
    <path d="M97.5 47.3 h4 l-2 2.6 z" fill="#E7788A"/>
    <path d="M99.5 50 q-1.5 3 -4 1.6 M99.5 50 q1.5 3 4 1.6" stroke="${points ? '#E8D9C4' : '#5A3A30'}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    <path d="M104 50 l10 -2 M104 52.5 l10 1.5" stroke="${points ? '#E8D9C4' : '#7a6a60'}" stroke-width=".8" stroke-linecap="round" opacity=".7"/>
    <ellipse class="tongue" cx="99.5" cy="54.5" rx="1.8" ry="2" fill="#F07A8A"/>
  </g></g>
</svg>`;
}

function dogSVG(p) {
  const short = p.legs === 'short';
  const legTop = short ? 74 : 64;
  const legH = short ? 22 : 32;
  const bodyCy = short ? 68 : 62;
  const headDy = short ? 6 : 0;
  const fluffy = p.fluffy;
  const earsBack = p.ears === 'floppy'
    ? `<ellipse cx="80" cy="${44 + headDy}" rx="6" ry="12" fill="${p.dark}" transform="rotate(18 80 ${44 + headDy})"/>`
    : `<path d="M76 ${36 + headDy} L78 ${14 + headDy} L91 ${27 + headDy} Z" fill="${p.fur}"/>
       <path d="M79.5 ${30 + headDy} L80.5 ${19.5 + headDy} L87 ${27 + headDy} Z" fill="${p.belly}"/>`;
  const earsFront = p.ears === 'floppy'
    ? ''
    : `<path d="M92 ${26 + headDy} L103 ${12 + headDy} L106 ${34 + headDy} Z" fill="${p.fur}"/>
       <path d="M95.5 ${27 + headDy} L102 ${18.5 + headDy} L103.5 ${31 + headDy} Z" fill="${p.belly}"/>`;
  const puffs = fluffy
    ? `<circle cx="36" cy="${bodyCy - 8}" r="10" fill="${p.fur}"/><circle cx="52" cy="${bodyCy - 12}" r="11" fill="${p.fur}"/>
       <circle cx="68" cy="${bodyCy - 9}" r="10" fill="${p.fur}"/><circle cx="28" cy="${bodyCy + 2}" r="9" fill="${p.fur}"/>`
    : '';
  return `
<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
  <g class="tail-wrap"><g class="tail">
    ${fluffy
      ? `<path d="M30 ${bodyCy - 4} C 24 ${bodyCy - 10}, 22 ${bodyCy - 18}, 24 ${bodyCy - 24}" stroke="${p.fur}" stroke-width="5" fill="none" stroke-linecap="round"/>
         <circle cx="24" cy="${bodyCy - 27}" r="6" fill="${p.fur}"/>`
      : `<path d="M30 ${bodyCy - 4} C 22 ${bodyCy - 10}, 19 ${bodyCy - 20}, 24 ${bodyCy - 28}" stroke="${p.fur}" stroke-width="7" fill="none" stroke-linecap="round"/>
         <path d="M22.5 ${bodyCy - 22} C 21 ${bodyCy - 25}, 22 ${bodyCy - 27}, 24 ${bodyCy - 28}" stroke="${p.belly}" stroke-width="6" fill="none" stroke-linecap="round"/>`}
  </g></g>
  <g class="legs-back">
    <rect class="leg lb1" x="30" y="${legTop}" width="10" height="${legH}" rx="5" fill="${shade(p.fur, -18)}"/>
    <rect class="leg lb2" x="41" y="${legTop}" width="10" height="${legH}" rx="5" fill="${p.fur}"/>
    <rect x="41" y="${legTop + legH - 6}" width="10" height="6" rx="3" fill="${p.belly}" class="leg lb2 sock"/>
  </g>
  <g class="legs-front">
    <rect class="leg lf1" x="67" y="${legTop}" width="10" height="${legH}" rx="5" fill="${shade(p.fur, -18)}"/>
    <rect class="leg lf2" x="78" y="${legTop}" width="10" height="${legH}" rx="5" fill="${p.fur}"/>
    <rect x="78" y="${legTop + legH - 6}" width="10" height="6" rx="3" fill="${p.belly}" class="leg lf2 sock"/>
  </g>
  <g class="torso-pose"><g class="torso">
    ${puffs}
    <ellipse cx="56" cy="${bodyCy}" rx="33" ry="17" fill="${p.fur}"/>
    <ellipse cx="64" cy="${bodyCy + 9}" rx="21" ry="7" fill="${p.belly}"/>
    ${fluffy ? '' : `<path d="M40 ${bodyCy - 14} q14 -5 30 0" stroke="${p.dark}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>`}
  </g></g>
  <g class="head-pose"><g class="head">
    ${earsBack}
    ${fluffy ? `<circle cx="88" cy="${24 + headDy}" r="9" fill="${p.fur}"/>` : ''}
    <circle cx="90" cy="${41 + headDy}" r="17" fill="${p.fur}"/>
    ${earsFront}
    ${p.ears === 'floppy' ? `<ellipse cx="81" cy="${46 + headDy}" rx="5.5" ry="11" fill="${p.dark}" transform="rotate(12 81 ${46 + headDy})"/>` : ''}
    <ellipse cx="103" cy="${49 + headDy}" rx="11" ry="8" fill="${p.belly}"/>
    ${p.eyeRing ? `<circle cx="99" cy="${38 + headDy}" r="4.6" fill="${p.eyeRing}"/><circle cx="88" cy="${38 + headDy}" r="4.6" fill="${p.eyeRing}"/>` : ''}
    ${eyes({ ...p, eyeLine: p.eyeRing ? '#1A1A1A' : '#2B2320' }, 88, 99, 38 + headDy)}
    <ellipse cx="112" cy="${45.5 + headDy}" rx="3.6" ry="2.9" fill="#231C19"/>
    <path d="M111.5 ${48.5 + headDy} q-1 4 -6 3.4" stroke="#4A332A" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <ellipse class="tongue" cx="107" cy="${54.5 + headDy}" rx="2.6" ry="3.4" fill="#F07A8A"/>
    <ellipse cx="85" cy="${48 + headDy}" rx="3.2" ry="2" fill="#FF8FA3" opacity=".35"/>
  </g></g>
</svg>`;
}

function petSVG(type, variant) {
  const group = PETS[type] || PETS.cat;
  const p = group.variants[variant] || Object.values(group.variants)[0];
  return type === 'dog' ? dogSVG(p) : catSVG(p);
}
