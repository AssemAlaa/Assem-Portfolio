document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- toast ---------- */
  const toast = $('#toast');
  let toastT;
  const say = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('show'), 1800);
  };

  /* ---------- page navigation ---------- */
  const navLinks = $$('.nav-link');
  const pages = $$('.page');
  const pageTitle = $('#pageTitle');
  const order = navLinks.map(l => l.dataset.page);

  function go(target) {
    const link = navLinks.find(l => l.dataset.page === target);
    if (!link) return;
    navLinks.forEach(l => l.classList.toggle('active', l === link));
    pages.forEach(p => p.classList.toggle('active', p.dataset.page === target));
    pageTitle.textContent = link.dataset.title;
    history.replaceState(null, '', '#' + target);
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    if (window.innerWidth <= 980) {
      $('#sidebarInfo').classList.remove('open');
      $('#sidebarToggle').classList.remove('open');
    }
    if (target === 'about') runCounters();
    revealTimeline();
  }
  navLinks.forEach(l => l.addEventListener('click', () => go(l.dataset.page)));

  // keyboard: ← → to switch pages (not while typing)
  document.addEventListener('keydown', (e) => {
    if (/input|textarea/i.test(e.target.tagName)) return;
    const cur = order.indexOf($('.nav-link.active').dataset.page);
    if (e.key === 'ArrowRight') go(order[(cur + 1) % order.length]);
    if (e.key === 'ArrowLeft') go(order[(cur - 1 + order.length) % order.length]);
    if (e.key === 'Escape') closeLb();
  });

  /* ---------- typing role ---------- */
  const typed = $('#typed');
  const words = typed.dataset.words.split('|');
  let wi = 0, ci = 0, del = false;
  (function tick() {
    const w = words[wi];
    if (reduce) { typed.textContent = words[0]; return; }
    ci += del ? -1 : 1;
    typed.textContent = w.slice(0, ci);
    let d = del ? 45 : 90;
    if (!del && ci === w.length) { del = true; d = 1400; }
    else if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; d = 300; }
    setTimeout(tick, d);
  })();

  /* ---------- avatar click ---------- */
  const avatar = $('#avatar');
  const hellos = ['Hi, I\'m Assem 👋', 'Open to work!', 'Let\'s talk data', 'Check my dashboards'];
  let hi = 0;
  avatar.addEventListener('click', () => {
    avatar.classList.remove('pop'); void avatar.offsetWidth; avatar.classList.add('pop');
    say(hellos[hi++ % hellos.length]);
    setTimeout(() => avatar.classList.remove('pop'), 1200);
  });

  /* ---------- animated counters + hints ---------- */
  let counted = false;
  function runCounters() {
    if (counted) return;
    counted = true;
    $$('.stat').forEach(el => {
      const end = +el.dataset.count, b = $('b', el);
      if (reduce) { b.textContent = end + '+'; return; }
      let n = 0;
      const t = setInterval(() => {
        b.textContent = ++n;
        if (n >= end) { clearInterval(t); b.textContent = end + '+'; }
      }, 140);
    });
  }
  runCounters();
  const hint = $('#statHint');
  $$('.stat').forEach(el => el.addEventListener('click', () => {
    hint.textContent = el.dataset.hint;
    hint.classList.add('on');
    if ($('b', el).textContent && el.querySelector('span').textContent === 'Dashboards') setTimeout(() => go('portfolio'), 900);
  }));

  /* ---------- service cards: expand (one at a time) ---------- */
  const cards = $$('.service-card');
  cards.forEach(card => {
    const toggle = () => {
      const open = !card.classList.contains('active');
      cards.forEach(c => { c.classList.remove('active'); c.setAttribute('aria-expanded', 'false'); });
      if (open) { card.classList.add('active'); card.setAttribute('aria-expanded', 'true'); }
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });

  /* ---------- skill tags: toggle + counter ---------- */
  $$('.skill-tag').forEach(tag => tag.addEventListener('click', () => {
    tag.classList.toggle('active');
    const n = $$('.skill-tag.active').length;
    if (n) say(n + (n === 1 ? ' skill' : ' skills') + ' highlighted');
  }));

  /* ---------- timeline reveal on scroll ---------- */
  const items = $$('.timeline-item').map(i => (i.classList.add('reveal'), i));
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 })
    : null;
  function revealTimeline() {
    items.forEach(i => io ? io.observe(i) : i.classList.add('in'));
  }
  revealTimeline();

  /* ---------- portfolio: filter, tilt, lightbox ---------- */
  const chips = $$('.chip');
  const projects = $$('.portfolio-item');
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.classList.toggle('active', x === c));
    projects.forEach(p => p.classList.toggle('hide', c.dataset.filter !== 'all' && p.dataset.cat !== c.dataset.filter));
  }));

  projects.forEach(p => {
    if (!reduce) {
      p.addEventListener('mousemove', e => {
        const r = p.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        p.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
      });
      p.addEventListener('mouseleave', () => p.style.transform = '');
    }
    const open = () => openLb(p);
    p.addEventListener('click', open);
    p.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
  });

  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  function openLb(p) {
    const img = $('img', p);
    lbImg.src = img.src; lbImg.alt = img.alt;
    lbCap.textContent = $('h4', p).textContent + ' · ' + $('.portfolio-caption p', p).textContent;
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
  }
  function closeLb() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); }
  lb.addEventListener('click', closeLb);
  $('#lbClose').addEventListener('click', closeLb);

  /* ---------- copy contact details ---------- */
  $$('.contact-card').forEach(card => {
    const copy = async (text) => {
      try { await navigator.clipboard.writeText(text); say('Copied: ' + text); }
      catch { say('Press Ctrl+C to copy: ' + text); }
    };
    card.addEventListener('click', e => {
      const t = e.target.closest('[data-copy]') || $('[data-copy]', card);
      if (t) copy(t.dataset.copy);
    });
    card.addEventListener('keydown', e => { if (e.key === 'Enter') card.click(); });
  });

  /* ---------- mobile sidebar toggle ---------- */
  const toggleBtn = $('#sidebarToggle'), sidebarInfo = $('#sidebarInfo');
  toggleBtn.addEventListener('click', () => {
    sidebarInfo.classList.toggle('open');
    toggleBtn.classList.toggle('open');
  });

  /* ---------- contact form ---------- */
  const form = $('#contactForm'), status = $('#formStatus');
  const msg = $('#msg'), count = $('#count');
  msg.addEventListener('input', () => {
    count.textContent = msg.value.length;
    count.parentElement.classList.toggle('warn', msg.value.length > 440);
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form);
    const body = `Name: ${d.get('name')}\nEmail: ${d.get('email')}\n\n${d.get('message')}`;
    window.location.href = `mailto:assemalaa1990@gmail.com?subject=${encodeURIComponent(d.get('subject'))}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Opening your email app…';
    say('Thanks, ' + d.get('name') + '!');
    form.reset(); count.textContent = 0;
  });

  /* ---------- accent colour switcher (remembered) ---------- */
  const root = document.documentElement;
  const setAccent = (c) => {
    root.style.setProperty('--gold', c);
    root.style.setProperty('--gold-soft', `color-mix(in srgb, ${c} 55%, #fff)`);
    $$('#themes button').forEach(b => b.classList.toggle('on', b.dataset.c === c));
  };
  $$('#themes button').forEach(b => b.addEventListener('click', () => {
    setAccent(b.dataset.c);
    try { localStorage.setItem('accent', b.dataset.c); } catch {}
  }));
  try { const a = localStorage.getItem('accent'); if (a) setAccent(a); } catch {}

  /* ---------- scroll progress + cursor glow ---------- */
  const bar = $('#progress');
  addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
  }, { passive: true });
  const glow = $('#glow');
  if (!reduce) addEventListener('mousemove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; });

  /* ---------- open page from URL hash ---------- */
  const h = location.hash.slice(1);
  if (order.includes(h)) go(h);
});
