/* Corvo Azul — Variante FINAL
   GSAP + ScrollTrigger, Lenis, SplitType, vanilla-tilt via CDN, cada um com fallback.
   Sem cursor customizado. Cursor do sistema, ponto. */

(function () {
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const temGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (temGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduz && typeof Lenis !== 'undefined' && temGsap) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const alvo = document.querySelector(a.getAttribute('href'));
      if (!alvo) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(alvo, { offset: -60 });
      else alvo.scrollIntoView({ behavior: reduz ? 'auto' : 'smooth' });
      fecharMenu();
    });
  });

  /* ---------- Nav ---------- */
  const nav = document.getElementById('nav');
  const barra = document.getElementById('progresso');
  const navLinks = [...document.querySelectorAll('.nav__links a[href^="#"]')];
  const secoes = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const ctaMobile = document.getElementById('cta-mobile');
  const heroEl = document.getElementById('hero');
  const mqMobile = window.matchMedia('(max-width: 52rem)');
  let ultimoY = window.scrollY;
  const onScroll = () => {
    nav.classList.toggle('rolou', window.scrollY > 24);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    barra.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    // seção ativa na nav
    const y = window.scrollY + window.innerHeight * 0.35;
    let atual = null;
    secoes.forEach((s) => { if (s.offsetTop <= y) atual = s; });
    navLinks.forEach((a) => a.classList.toggle('ativo', !!atual && a.getAttribute('href') === '#' + atual.id));
    // CTA fixo do mobile: só depois do hero e antes do rodapé
    if (ctaMobile && heroEl && mqMobile.matches) {
      const subindo = window.scrollY < ultimoY - 4;
      ultimoY = window.scrollY;
      const depoisDoHero = window.scrollY > heroEl.offsetHeight - 80;
      const pertoDoFim = window.scrollY + window.innerHeight > document.documentElement.scrollHeight - 220;
      const mostrar = depoisDoHero && !pertoDoFim && !subindo;
      ctaMobile.classList.toggle('visivel', mostrar);
      ctaMobile.setAttribute('aria-hidden', String(!mostrar));
      ctaMobile.tabIndex = mostrar ? 0 : -1;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuBtn = document.getElementById('menu-btn');
  const links = document.getElementById('nav-links');
  function setMenu(aberto) {
    links.classList.toggle('aberto', aberto);
    nav.classList.toggle('menu-aberto', aberto);
    document.body.classList.toggle('menu-aberto', aberto);
    menuBtn.setAttribute('aria-expanded', String(aberto));
    menuBtn.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    if (lenis) { aberto ? lenis.stop() : lenis.start(); }
  }
  function fecharMenu() { if (links.classList.contains('aberto')) setMenu(false); }
  menuBtn.addEventListener('click', () => setMenu(!links.classList.contains('aberto')));
  links.addEventListener('click', (e) => { if (e.target === links) fecharMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharMenu(); });

  /* ---------- Clique com peso (da variante C), em todo [data-clique] ----------
     pointerdown: encolhe. click: onda radial a partir do ponto exato + anel de luz. */
  document.querySelectorAll('[data-clique]').forEach((el) => {
    const encolher = () => { if (temGsap && !reduz) gsap.to(el, { scale: 0.96, duration: 0.15, ease: 'power2.out' }); };
    const soltar = () => { if (temGsap && !reduz) gsap.to(el, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.45)' }); };
    el.addEventListener('pointerdown', encolher);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => el.addEventListener(ev, soltar));
    el.addEventListener('click', (e) => {
      if (reduz) return;
      const r = el.getBoundingClientRect();
      const onda = document.createElement('span');
      onda.className = 'onda';
      onda.style.left = (e.clientX ? e.clientX - r.left : r.width / 2) + 'px';
      onda.style.top = (e.clientY ? e.clientY - r.top : r.height / 2) + 'px';
      el.appendChild(onda);
      onda.addEventListener('animationend', () => onda.remove());
      el.classList.add('acionado');
      setTimeout(() => el.classList.remove('acionado'), 1200);
    });
  });

  /* ---------- Botões magnéticos ---------- */
  if (fino && !reduz && temGsap) {
    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, { x: (e.clientX - (r.left + r.width / 2)) * 0.35, y: (e.clientY - (r.top + r.height / 2)) * 0.35, duration: 0.5, ease: 'power3.out' });
      });
      btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' }));
    });
  }

  /* ---------- Hero: título letra a letra + glow amarrado ao scroll ---------- */
  const titulo = document.getElementById('hero-titulo');
  if (!reduz && temGsap && typeof SplitType !== 'undefined') {
    const splits = [...titulo.querySelectorAll('.linha')].map((l) => new SplitType(l, { types: 'words,chars' }));
    splits[splits.length - 1].words.slice(-2).forEach((w) => w.classList.add('brilha'));
    gsap.from(splits.flatMap((sp) => sp.chars), { yPercent: 110, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.018, delay: 0.15 });
    gsap.to('[data-fade]', { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.15, delay: 0.7 });
  } else {
    document.querySelectorAll('[data-fade]').forEach((el) => (el.style.opacity = 1));
  }
  /* Vídeo do hero: se falhar, cai no sheen da variante A; com reduced-motion, fica no poster */
  const heroVideo = document.getElementById('hero-video');
  if (heroVideo) {
    const falhou = () => { const h = heroVideo.closest('.hero'); if (h) h.classList.add('sem-foto'); heroVideo.parentElement.remove(); };
    heroVideo.querySelector('source').addEventListener('error', falhou);
    heroVideo.addEventListener('error', falhou);
    if (reduz) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
    else heroVideo.play().catch(() => {});
  }
  const heroCorvo = document.getElementById('hero-corvo');
  if (heroCorvo && !reduz && temGsap) {
    // Intensidade do glow cai conforme o hero sai de cena: "azul num só elemento, mas com movimento"
    gsap.fromTo(heroCorvo, { '--glow': 0.85 }, {
      '--glow': 0.2, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.5 },
    });
    if (!mqMobile.matches) gsap.to(heroCorvo, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- Reveals ---------- */
  if (!reduz && temGsap) {
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      // No celular o terminal entra parado: a única animação dele é a digitação
      if (mqMobile.matches && el.classList.contains('split__visual')) { el.style.opacity = 1; el.style.transform = 'none'; return; }
      gsap.to(el, { opacity: 1, x: 0, y: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
  } else {
    document.querySelectorAll('[data-reveal]').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
  }

  /* ---------- Parallax leve nas fotos dos eixos ---------- */
  if (!reduz && temGsap && !mqMobile.matches) {
  }

  /* ---------- Contadores ---------- */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const alvo = parseInt(el.dataset.count, 10);
    const sufixo = el.dataset.suffix || '';
    const render = (v) => (el.textContent = Math.round(v) + sufixo);
    if (reduz || !temGsap) { render(alvo); return; }
    const obj = { v: 0 };
    gsap.to(obj, { v: alvo, duration: 1.6, ease: 'power3.out', onUpdate: () => render(obj.v), scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  /* ---------- Terminal (lógica de digitação da variante B) ---------- */
  const term = document.getElementById('terminal');
  if (term) {
    const roteiro = [
      { t: 'cmd', s: 'claude' },
      { t: 'out', s: '<span class="d">Claude Code · organizador-downloads · branch main</span>' },
      { t: 'cmd', p: '›', s: 'antes de mover qualquer arquivo, roda em modo simulação e me mostra o que mudaria' },
      { t: 'out', s: '<span class="d">Lendo ~/Downloads… 1.284 arquivos · 9 extensões · 2,1 GB</span>' },
      { t: 'out', s: '<span class="d">Plano:</span>\n  1. Agrupar por tipo → Imagens / Documentos / Instaladores / Outros\n  2. Dentro de cada grupo, subpasta AAAA-MM\n  3. Duplicados: manter o mais novo, listar o resto' },
      { t: 'out', s: '<span class="ok">✓</span> --dry-run: 312 arquivos seriam movidos\n<span class="ok">✓</span> 0 apagados · 18 duplicados listados em duplicados.txt\n<span class="w">!</span> 3 arquivos sem data válida → vão para Outros/sem-data' },
      { t: 'cmd', p: '›', s: 'ok. escreve os testes pra esses 3 casos antes de rodar de verdade' },
      { t: 'out', s: '<span class="ok">✓</span> test_organizador.py · 14 testes · 14 passando (0,41s)\n<span class="ok">✓</span> README atualizado com o plano e os limites do script' },
    ];
    let iniciado = false;
    const iniciar = () => { if (!iniciado) { iniciado = true; rodar(); } };
    new IntersectionObserver((ents, io) => {
      if (ents.some((e) => e.isIntersecting)) { io.disconnect(); iniciar(); }
    }, { threshold: 0.2 }).observe(term);
    const checarVisivel = () => { const r = term.getBoundingClientRect(); if (r.top < innerHeight * 0.9 && r.bottom > 0) { iniciar(); window.removeEventListener('scroll', checarVisivel); } };
    window.addEventListener('scroll', checarVisivel, { passive: true });
    setTimeout(checarVisivel, 800);

    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const linha = (it) => (it.t === 'cmd' ? `<span class="p">${it.p || '$'}</span> ${esc(it.s)}` : it.s);
    function rodar() {
      if (reduz) { term.innerHTML = roteiro.map(linha).join('\n'); return; }
      const buf = []; const cur = '<span class="cur"></span>'; let i = 0;
      (function passo() {
        if (i >= roteiro.length) { term.innerHTML = buf.join('\n') + '\n<span class="p">›</span> ' + cur; return; }
        const it = roteiro[i++];
        if (it.t === 'cmd') {
          const pre = `<span class="p">${it.p || '$'}</span> `; let k = 0;
          (function tecla() {
            term.innerHTML = buf.concat(pre + esc(it.s.slice(0, k)) + cur).join('\n');
            if (k++ < it.s.length) setTimeout(tecla, 16 + Math.random() * 38);
            else { buf.push(pre + esc(it.s)); setTimeout(passo, 320); }
          })();
        } else {
          setTimeout(() => { buf.push(it.s); term.innerHTML = buf.join('\n') + '\n' + cur; setTimeout(passo, 420); }, 280);
        }
      })();
    }
  }

  /* ---------- Glifos gerativos dos quatro eixos ----------
     Variação do glifo v7 (cabeça de corvo de perfil, bico reto sem gancho, olho em losango,
     tufos só na nuca e na garganta) em linha fina + um motivo por pilar. Os tufos são
     gerados com semente por pilar, então cada glifo é levemente diferente. */
  const NS = 'http://www.w3.org/2000/svg';
  // Glifo v7 canonico (claude/corvo_glifo.svg, potrace sobre o PNG 800x800), mesma coordenada do design system.
  const CABECA = 'M85.97 41.35 C82.62 41.75 81.03 42.19 78.60 43.44 C72.72 46.40 68.73 51.61 65.36 60.80 C63.03 67.19 59.52 82.32 56.18 100.47 C54.51 109.60 52.16 117.12 48.68 124.57 C47.73 126.57 47.02 128.26 47.08 128.34 C47.25 128.53 49.53 127.65 51.54 126.62 C52.60 126.08 53.52 125.72 53.61 125.79 C54.03 126.25 52.18 131.10 49.92 135.36 C49.14 136.83 47.94 139.21 47.25 140.63 L46.00 143.20 L46.60 143.27 C46.92 143.32 48.08 143.05 49.18 142.71 C50.27 142.37 51.24 142.12 51.31 142.20 C51.51 142.44 50.61 144.30 48.28 148.44 C46.42 151.72 46.07 152.51 46.32 152.75 C46.48 152.92 48.03 153.41 49.74 153.83 C58.00 155.91 62.78 157.09 66.24 157.89 C67.76 158.24 69.42 158.63 69.93 158.75 C71.80 159.22 77.57 160.54 78.58 160.73 C79.16 160.83 80.36 161.10 81.23 161.32 C82.13 161.52 83.38 161.81 84.00 161.93 C84.65 162.06 86.40 162.42 87.93 162.77 C92.38 163.72 94.27 164.11 96.35 164.53 C97.43 164.73 98.73 165.00 99.23 165.12 C99.74 165.24 102.90 165.90 106.27 166.59 C109.64 167.27 112.85 167.93 113.42 168.06 C114.00 168.18 116.12 168.57 118.15 168.91 C120.18 169.26 123.05 169.75 124.50 170.02 C125.95 170.28 127.94 170.60 128.88 170.75 C129.83 170.87 131.28 171.12 132.11 171.24 C136.61 172.00 138.92 172.19 139.29 171.80 C139.82 171.24 140.21 168.23 140.33 163.40 C140.47 158.58 140.33 156.08 139.73 152.31 C139.57 151.38 139.52 150.57 139.59 150.50 C139.80 150.28 140.91 151.16 142.66 152.95 C143.70 154.00 144.41 154.56 144.60 154.47 C144.92 154.25 144.74 150.77 144.32 149.08 C143.33 145.09 142.01 141.63 140.56 139.21 C140.21 138.62 139.98 138.06 140.08 137.98 C140.14 137.91 140.91 138.08 141.76 138.38 C142.64 138.67 143.40 138.92 143.49 138.92 C144.09 138.92 142.75 135.83 140.38 131.67 C138.37 128.19 138.00 127.43 136.91 124.71 C135.11 120.21 134.77 118.42 134.77 113.33 C134.77 108.35 134.95 107.40 136.50 104.07 C138.51 99.81 141.28 97.26 145.57 95.72 C147.39 95.08 151.68 94.25 155.30 93.83 C156.32 93.73 158.19 93.51 159.46 93.39 C163.43 92.93 170.56 92.39 175.84 92.14 C178.63 92.02 181.36 91.85 181.89 91.75 C183.09 91.55 185.62 92.17 187.91 93.17 C188.83 93.59 189.66 93.83 189.75 93.73 C189.85 93.66 189.96 92.71 189.99 91.65 C190.17 87.51 188.60 83.65 184.86 79.11 C182.39 76.10 177.43 72.38 172.84 70.10 C166.82 67.12 162.18 65.67 149.07 62.73 C142.82 61.34 142.71 61.29 141.57 59.96 C138.76 56.66 135.00 52.91 133.04 51.44 C130.25 49.34 124.73 46.42 121.08 45.13 C114.88 42.95 108.23 41.67 100.23 41.21 C94.90 40.89 89.29 40.94 85.97 41.35 Z';
  const OLHO = 'M119.05 62.54 C121.45 63.30 122.93 64.37 125.68 67.34 C128.35 70.23 129.58 71.82 129.58 72.38 C129.58 72.72 126.58 73.73 123.12 74.54 C121.04 75.03 116.54 74.95 115.04 74.41 C112.62 73.53 110.63 72.26 108.62 70.25 C106.13 67.73 103.46 64.52 103.57 64.15 C103.66 63.83 106.71 62.90 109.27 62.41 C110.22 62.24 112.45 62.07 114.21 62.05 C116.86 62.02 117.69 62.12 119.05 62.54 Z';
  const MOTIVOS = {
    1: ['M158 132 L182 152 L158 172', 'M190 172 L226 172'],                                   // prompt do terminal
    2: ['M190 126 L226 140 L190 154 L154 140 Z', 'M154 156 L190 170 L226 156', 'M154 172 L190 186 L226 172'], // camadas: do zero ao ar
    3: ['circle:160,142,7', 'circle:220,124,7', 'circle:220,178,7', 'M167 140 L213 126', 'M167 144 L213 176'],  // nós: agentes
    4: ['M190 188 L190 154', 'M190 154 L162 122', 'M190 154 L218 122', 'M162 122 L162 134', 'M162 122 L174 122'], // bifurcação: decisão
  };
  function semente(n) { let s = n * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function mk(tag, attrs, cls) { const el = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); el.setAttribute('class', cls); return el; }

  const tracos = [];
  document.querySelectorAll('.eixo__glifo').forEach((svg) => {
    const n = +svg.dataset.glifo;
    const rnd = semente(n);
    const grupo = [];
    grupo.push(mk('path', { d: CABECA }, 'cabeca'));
    grupo.push(mk('path', { d: OLHO }, 'olho'));
    // tufos da nuca (esquerda) e da garganta (embaixo), gerados
    for (let i = 0; i < 7; i++) {
      const y = 118 + i * 5.5 + rnd() * 2, x = 51 - i * 0.7;
      const len = 9 + rnd() * 13, ang = Math.PI * (0.86 + rnd() * 0.16);
      grupo.push(mk('path', { d: `M${x.toFixed(1)} ${y.toFixed(1)} L${(x + Math.cos(ang) * len).toFixed(1)} ${(y + Math.sin(ang) * len).toFixed(1)}` }, 'barba'));
    }
    for (let i = 0; i < 5; i++) {
      const x = 134 + rnd() * 2, y = 128 + i * 6 + rnd() * 2;
      const len = 7 + rnd() * 9, ang = Math.PI * (0.08 + rnd() * 0.18);
      grupo.push(mk('path', { d: `M${x.toFixed(1)} ${y.toFixed(1)} L${(x + Math.cos(ang) * len).toFixed(1)} ${(y + Math.sin(ang) * len).toFixed(1)}` }, 'barba'));
    }
    (MOTIVOS[n] || []).forEach((m) => {
      if (m.startsWith('circle:')) { const [cx, cy, r] = m.slice(7).split(',').map(Number); grupo.push(mk('circle', { cx, cy, r }, 'motivo')); }
      else grupo.push(mk('path', { d: m }, 'motivo'));
    });
    grupo.forEach((el) => svg.appendChild(el));
    tracos.push({ svg, grupo });
  });

  if (!reduz && temGsap) {
    tracos.forEach(({ svg, grupo }) => {
      grupo.forEach((el) => { const L = el.getTotalLength(); el.style.strokeDasharray = L; el.style.strokeDashoffset = L; });
      gsap.to(grupo, {
        strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.06,
        scrollTrigger: { trigger: svg, start: 'top 80%', once: true },
      });
    });
  }

  /* ---------- CTA final: entrada mais forte que o resto da página ---------- */
  const final = document.getElementById('final');
  const finalTitulo = document.getElementById('final-titulo');
  if (final && !reduz && temGsap) {
    let chars = null;
    if (typeof SplitType !== 'undefined') chars = [...finalTitulo.querySelectorAll('.linha')].flatMap((l) => new SplitType(l, { types: 'words,chars' }).chars);
    gsap.set(['.final__glow', '.final-corvo'], { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' });
    gsap.set('.final .btn--grande', { opacity: 0, scale: 0.7 });
    if (chars) gsap.set(chars, { yPercent: 120, rotate: 6, opacity: 0 });
    const tl = gsap.timeline({
      scrollTrigger: { trigger: final, start: 'top 65%', once: true },
      onComplete: () => final.classList.add('ativo'),
    });
    tl.to('.final-corvo', { opacity: 1, scale: 1, duration: 2.2, ease: 'power2.out' }, 0)
      .to('.final__glow', { opacity: 1, scale: 1, duration: 1.8, ease: 'expo.out', stagger: 0.15, clearProps: 'transform,opacity' }, 0.1)
      .to('[data-final]', { opacity: 1, duration: 0.8, stagger: 0.2 }, 0.5);
    if (chars) tl.to(chars, { yPercent: 0, rotate: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.02 }, 0.35);
    tl.to('.final .btn--grande', { opacity: 1, scale: 1, duration: 1.1, ease: 'elastic.out(1, 0.5)' }, 1.0);
  } else if (final) {
    final.classList.add('ativo');
    document.querySelectorAll('[data-final]').forEach((el) => (el.style.opacity = 1));
  }

  /* ---------- Prova viva: API pública do GitHub ----------
     Sem chave: 60 requisições por hora POR ENDEREÇO IP. Quem acessa atrás de CGNAT (comum nas
     operadoras brasileiras) divide essa cota com desconhecidos, então a falha é esperada, não rara.
     Por isso o bloco NUNCA some: sem resposta da API, mostra a versão fixa e verificável. */
  (async function githubVivo() {
    const bloco = document.getElementById('vivo');
    if (!bloco) return;
    const resumoEl = () => document.getElementById('vivo-resumo');

    // Texto fixo: só afirma o que é verdade sem consultar nada.
    const mostrarFixo = () => {
      const el = resumoEl();
      if (el) el.textContent = 'código aberto em github.com/Corvo-azul';
      bloco.classList.add('vivo--fixo');
      bloco.hidden = false;
    };
    if (!window.fetch) { mostrarFixo(); return; }
    const USER = 'Corvo-azul';
    const chave = 'corvoazul.github.' + USER;
    const agora = Date.now();
    let dados = null;
    try {
      const cache = JSON.parse(sessionStorage.getItem(chave) || 'null');
      if (cache && agora - cache.t < 30 * 60 * 1000) dados = cache.d;
    } catch (e) { /* sem storage */ }
    if (!dados) {
      try {
        const [u, r] = await Promise.all([
          fetch(`https://api.github.com/users/${USER}`),
          fetch(`https://api.github.com/users/${USER}/repos?sort=pushed&per_page=6&type=owner`),
        ]);
        if (!u.ok || !r.ok) { mostrarFixo(); return; }  // cota estourada ou GitHub fora do ar
        const user = await u.json();
        const repos = (await r.json()).filter((x) => !x.fork);
        dados = { publicos: user.public_repos, repos: repos.map((x) => ({ n: x.name, d: x.description, u: x.html_url, p: x.pushed_at, l: x.language })) };
        try { sessionStorage.setItem(chave, JSON.stringify({ t: agora, d: dados })); } catch (e) { /* sem storage */ }
      } catch (e) { mostrarFixo(); return; }  // sem rede, bloqueador, CORS
    }
    const rel = (iso) => {
      const dias = Math.floor((agora - new Date(iso).getTime()) / 86400000);
      if (dias <= 0) return 'hoje'; if (dias === 1) return 'ontem'; if (dias < 30) return `há ${dias} dias`;
      const m = Math.floor(dias / 30); return m === 1 ? 'há 1 mês' : `há ${m} meses`;
    };
    const resumo = document.getElementById('vivo-resumo');
    const lista = document.getElementById('vivo-repos');
    const n = dados.publicos;
    if (n === 0 || dados.repos.length === 0) {
      resumo.textContent = 'ao vivo do GitHub · nenhum repositório público ainda · o primeiro sai com o vídeo 1';
    } else {
      const ultimo = dados.repos[0];
      resumo.textContent = `ao vivo do GitHub · ${n} repositório${n === 1 ? '' : 's'} público${n === 1 ? '' : 's'} · último push ${rel(ultimo.p)}`;
      lista.innerHTML = dados.repos.slice(0, 4).map((x) => `
        <li><span><a href="${x.u}" target="_blank" rel="noopener">${x.n}</a>${x.d ? `<span class="desc">${String(x.d).replace(/</g, '&lt;')}</span>` : ''}</span>
        <time datetime="${x.p}">${x.l ? x.l + ' · ' : ''}${rel(x.p)}</time></li>`).join('');
    }
    bloco.hidden = false;
    if (temGsap && !reduz) gsap.from(bloco, { opacity: 0, y: 12, duration: 0.8, ease: 'power2.out' });
  })();

  /* ---------- Tilt no terminal ---------- */
  if (fino && !reduz && typeof VanillaTilt !== 'undefined') {
    VanillaTilt.init(document.querySelectorAll('[data-tilt]'), { max: 5, speed: 900, glare: true, 'max-glare': 0.07, gyroscope: false });
  }

  document.querySelectorAll('main img:not([fetchpriority])').forEach((img) => img.setAttribute('loading', 'lazy'));
})();
