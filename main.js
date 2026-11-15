// Sawa website. All motion is plain CSS + a little JavaScript, no libraries.

// Download links. Put the real file addresses here. An empty one shows "قريب".
// The big files (Mac, Windows) live in a GitHub "release". Put the release address here, ending with a slash.
// Example: 'https://github.com/YOUR-NAME/sawa-website/releases/latest/download/'
const RELEASES = '';
const DOWNLOADS = {
  macArm: RELEASES && RELEASES + 'Sawa-0.2.0-mac-arm64.dmg',
  macIntel: RELEASES && RELEASES + 'Sawa-0.2.0-mac-x64.dmg',
  windows: RELEASES && RELEASES + 'Sawa-0.2.0-windows.zip',
  android: 'downloads/Sawa-android.apk',
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- download buttons ---- */
for (const a of $$('[data-dl]')) {
  const link = DOWNLOADS[a.dataset.dl];
  if (link) { a.href = link; a.setAttribute('download', ''); }
  else { a.classList.add('off'); a.textContent = 'قريب'; a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); }
}

/* ---- headline: each word slides up ---- */
for (const h of $$('.split')) {
  let i = 0;
  const wrap = (node) => {
    for (const n of [...node.childNodes]) {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part.trim()) { frag.append(part); return; }
          const w = document.createElement('span'); w.className = 'w';
          const s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
          w.append(s); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') wrap(n);
    }
  };
  wrap(h);
}
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('loaded')));

/* ---- things appear when you scroll to them ---- */
const seen = new IntersectionObserver((list) => {
  for (const e of list) if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); if (e.target.querySelector && e.target.querySelector('#code')) scramble($('#code')); }
}, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
$$('.reveal').forEach((el) => seen.observe(el));

/* ---- scroll: top bar, nav, big moving line, steps line ---- */
const nav = $('#nav'), band = $('#band'), steps = $('#steps'), rail = $('#rail');
let ticking = false;
function onScroll() {
  ticking = false;
  const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
  document.documentElement.style.setProperty('--p', max > 0 ? y / max : 0);
  nav.classList.toggle('scrolled', y > 30);
  if (band) { const r = band.parentElement.getBoundingClientRect(); band.style.transform = `translateX(${-200 + (innerHeight - r.top) * 0.35}px)`; }
  if (steps) { const r = steps.getBoundingClientRect(); rail.style.setProperty('--r', Math.max(0, Math.min(1, (innerHeight * 0.62 - r.top) / r.height))); }
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener('resize', onScroll);
onScroll();

if (!calm) {
  /* ---- light follows the pointer in the hero ---- */
  const hero = $('.hero');
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
    hero.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
  });
  /* ---- cards lean toward the pointer ---- */
  for (const el of $$('.tilt')) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', (x - 0.5) * 10 + 'deg'); el.style.setProperty('--rx', (0.5 - y) * 10 + 'deg');
      el.style.setProperty('--px', x * 100 + '%'); el.style.setProperty('--py', y * 100 + '%');
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  }
  /* ---- buttons pull a little toward the pointer ---- */
  for (const b of $$('.magnetic')) {
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  }
}

/* ---- room code letters shuffle into place ---- */
function scramble(el) {
  if (!el || calm) return;
  const end = el.textContent, set = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let f = 0;
  const id = setInterval(() => {
    f++;
    el.textContent = [...end].map((c, i) => (f > 6 + i * 4 ? c : set[Math.floor(Math.random() * set.length)])).join('');
    if (f > 6 + end.length * 4) clearInterval(id);
  }, 45);
}

/* ---- questions open and close smoothly ---- */
for (const d of $$('.faq details')) {
  d.querySelector('summary').addEventListener('click', (e) => {
    e.preventDefault();
    if (d.classList.contains('on')) { d.classList.remove('on'); setTimeout(() => { d.open = false; }, calm ? 0 : 450); }
    else { d.open = true; requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('on'))); }
  });
}

/* ---- the live demo: two screens on the same second ---- */
(function demo() {
  const box = $('.demo'); if (!box) return;
  const A = $('#scrA'), B = $('#scrB'), tap = $('#tap'), chat = $('#chat'), fl = $('#floaters');
  const both = [A, B];
  let sec = 724, playing = true, visible = true, step = 0;
  const mmss = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  function paint() { for (const s of both) { $('.clock', s).textContent = mmss(sec); $('.fill', s).style.width = ((sec % 120) / 120) * 100 + '%'; } }
  function tapOn(scr) {
    const r = $('.film', scr).getBoundingClientRect(), p = box.getBoundingClientRect();
    tap.style.left = r.left - p.left + r.width / 2 + 'px'; tap.style.top = r.top - p.top + r.height / 2 + 'px';
    tap.classList.remove('go'); void tap.offsetWidth; tap.classList.add('go');
    both.forEach((s) => { s.classList.add('hit'); setTimeout(() => s.classList.remove('hit'), 700); });
  }
  const lines = [['منى', 'المشهد ده تحفة', ''], ['علي', 'استني اللي جاي', 'me'], ['منى', 'وقّف ثانية', ''], ['علي', 'تمام، كمّلي', 'me'], ['منى', 'قدّم شوية', '']];
  let li = 0;
  function say() {
    const [n, t, c] = lines[li++ % lines.length];
    const p = document.createElement('p'); p.className = c;
    const b = document.createElement('b'); b.textContent = n; p.append(b, t);
    chat.append(p);
    if (chat.children.length > 2) { const old = chat.children[0]; old.classList.add('out'); setTimeout(() => old.remove(), 400); }
  }
  function heart() {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24');
    s.innerHTML = '<path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.400 3 5 6.300 5c2 0 3.400 1 4.200 2.300.8-1.300 2.200-2.300 4.200-2.300 3.300 0 5.400 3.400 3.900 6.800C19.500 16.400 12 21 12 21z"/>';
    s.style.left = 30 + Math.random() * 60 + '%'; s.style.animationDuration = 2.2 + Math.random() * 1.2 + 's';
    fl.append(s); setTimeout(() => s.remove(), 3500);
  }
  paint();
  if (calm) return;
  new IntersectionObserver((l) => { visible = l[0].isIntersecting; }).observe(box);
  setInterval(() => {
    if (!visible || document.hidden) return;
    step = (step + 1) % 12;                       // one loop = 12 seconds
    if (step === 3) { tapOn(A); playing = false; both.forEach((s) => s.classList.add('paused')); }
    if (step === 5) { tapOn(B); playing = true; both.forEach((s) => s.classList.remove('paused')); }
    if (step === 9) { tapOn(A); sec += 37; both.forEach((s) => { s.classList.add('seek'); setTimeout(() => s.classList.remove('seek'), 600); }); }
    if (playing) sec++;
    paint();
    if (step % 3 === 1) say();
    if (step % 2 === 0 && playing) heart();
  }, 1000);
})();
