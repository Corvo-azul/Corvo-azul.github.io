// Gera as páginas de serviço a partir de servicos/servicos.json:
//   /servicos/index.html          lista de todos os serviços
//   /servicos/<slug>/index.html   uma página por serviço
//   index.html (home)             os cards entre <!-- servicos:inicio --> e <!-- servicos:fim -->
//
// Uso: node servicos/gerar.mjs   (depois, node blog/gerar.mjs para atualizar o sitemap)
//
// O desenho do corvo e dos motivos NÃO é copiado aqui: o script lê CABECA, OLHO e MOTIVOS
// direto do script.js, que continua sendo a única fonte. Nas páginas de serviço o SVG sai
// pronto no HTML (não depende de JavaScript); na home ele continua sendo desenhado pelo
// script.js, com a animação de traço.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..');
const SITE = 'https://corvoazul.com';
const WHATS = '5521969891805';
const GA = 'G-GHV4D0XHY8';

const dados = JSON.parse(readFileSync(join(AQUI, 'servicos.json'), 'utf8'));
const servicos = dados.servicos;

// ---- desenho, lido do script.js ----
const js = readFileSync(join(RAIZ, 'script.js'), 'utf8');
const pega = (re, nome) => { const m = js.match(re); if (!m) throw new Error(`não achei ${nome} no script.js`); return m[1]; };
const CABECA = pega(/const CABECA = '([^']+)'/, 'CABECA');
const OLHO = pega(/const OLHO = '([^']+)'/, 'OLHO');
const MOTIVOS = new Function(`return ${pega(/const MOTIVOS = (\{[\s\S]*?\n  \});/, 'MOTIVOS')}`)();

// Mesmo gerador com semente do script.js: o corvo da página é idêntico ao do card da home.
function semente(n) { let s = n * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
function glifoSVG(n, classe = 'eixo__glifo') {
  const rnd = semente(n);
  const p = [`<path class="cabeca" d="${CABECA}"/>`, `<path class="olho" d="${OLHO}"/>`];
  for (let i = 0; i < 7; i++) {
    const y = 118 + i * 5.5 + rnd() * 2, x = 51 - i * 0.7;
    const len = 9 + rnd() * 13, ang = Math.PI * (0.86 + rnd() * 0.16);
    p.push(`<path class="barba" d="M${x.toFixed(1)} ${y.toFixed(1)} L${(x + Math.cos(ang) * len).toFixed(1)} ${(y + Math.sin(ang) * len).toFixed(1)}"/>`);
  }
  for (let i = 0; i < 5; i++) {
    const x = 134 + rnd() * 2, y = 128 + i * 6 + rnd() * 2;
    const len = 7 + rnd() * 9, ang = Math.PI * (0.08 + rnd() * 0.18);
    p.push(`<path class="barba" d="M${x.toFixed(1)} ${y.toFixed(1)} L${(x + Math.cos(ang) * len).toFixed(1)} ${(y + Math.sin(ang) * len).toFixed(1)}"/>`);
  }
  for (const m of MOTIVOS[n] || []) {
    if (m.startsWith('circle:')) { const [cx, cy, r] = m.slice(7).split(','); p.push(`<circle class="motivo" cx="${cx}" cy="${cy}" r="${r}"/>`); }
    else p.push(`<path class="motivo" d="${m}"/>`);
  }
  return `<svg class="${classe}" viewBox="0 0 240 200" aria-hidden="true">${p.join('')}</svg>`;
}

// ---- utilitários ----
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (n) => String(n).padStart(2, '0');
const nomeCurto = (s) => s.nome_curto || s.nome;
const wa = (texto) => `https://wa.me/${WHATS}?text=${encodeURIComponent(texto)}`;
const msg = (s) => s.tipo === 'gratis'
  ? 'Olá! Vim pelo site e quero o diagnóstico grátis do meu negócio. Nome do negócio: , cidade: '
  : `Olá! Vim pelo site e quero um orçamento de ${s.nome}.`;
const SETA_P = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const VOLTA = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
const SETA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>';
const MARCA = readFileSync(join(RAIZ, 'privacidade', 'index.html'), 'utf8').match(/<svg viewBox="0 0 800 685\.8"[\s\S]*?<\/svg>/)[0]
  .replace(/style="[^"]*"/, '').replace(/width="\d+"/, 'width="22"');

// ---- card (home e /servicos/) ----
// `estatico`: SVG pronto no HTML. Na home vai vazio e o script.js desenha.
function card(s, estatico) {
  const svg = estatico ? glifoSVG(s.n) : `<svg class="eixo__glifo" data-glifo="${s.n}" viewBox="0 0 240 200" aria-hidden="true"></svg>`;
  const tags = [s.preco, s.prazo].map((t) => `<li>${esc(t)}</li>`).join('');
  return `      <article class="eixo eixo--card"${estatico ? '' : ' data-reveal'}>
        <div class="eixo__visual" data-glow="${s.n}">
          <span class="eixo__num">${num(s.n)}</span>
          ${svg}
        </div>
        <div class="eixo__texto">
          <h3><a class="eixo__link" href="/servicos/${s.slug}/">${esc(nomeCurto(s))}</a></h3>
          <p>${esc(s.card)}</p>
          <ul class="tags">${tags}</ul>
          <span class="eixo__mais" aria-hidden="true">Ver preço e como funciona ${SETA_P}</span>
        </div>
      </article>`;
}

// ---- moldura comum ----
function cabeca({ titulo, descricao, url, jsonld }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA}');
  </script>
  <title>${esc(titulo)}</title>
  <meta name="description" content="${esc(descricao)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#07090D">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Corvo Azul">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(titulo)}">
  <meta property="og:description" content="${esc(descricao)}">
  <meta property="og:image" content="${SITE}/assets/og.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon-180.png">
  <link rel="stylesheet" href="/assets/fonts/fonts.css">
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="/servicos/servicos.css">
  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>`;
}

function topo(link) {
  return `  <a class="pular" href="#conteudo">Pular para o conteúdo</a>
  <header class="sv-topo">
    <a class="sv-marca" href="/">${MARCA}<span>Corvo Azul</span></a>
    <nav class="sv-nav" aria-label="Principal">
      <a href="/servicos/">Serviços</a>
      <a href="/blog/">Blog</a>
    </nav>
    <a class="nav__cta nav__cta--cheio" href="${link}" target="_blank" rel="noopener">Orçamento</a>
  </header>`;
}

function rodape(link, rotulo = 'Pedir orçamento') {
  return `  <footer class="sv-rodape">
    <p>© 2026 · Corvo Azul · Sites, lojas e Google para pequenos negócios.</p>
    <p><a href="/servicos/">Serviços</a> · <a href="/privacidade/">Privacidade</a> · <a href="mailto:contato@corvoazul.com">contato@corvoazul.com</a></p>
  </footer>
  <a class="sv-cta-movel" id="sv-cta-movel" href="${link}" target="_blank" rel="noopener"><span>${rotulo}</span>${SETA}</a>
  <script>
    // Esconde o botao fixo do celular enquanto os botoes do topo ou o fechamento estao na tela,
    // para ele nao cobrir o mesmo botao. Sem JavaScript ele so fica sempre visivel.
    (function () {
      var cta = document.getElementById('sv-cta-movel');
      var alvos = document.querySelectorAll('.sv-acoes, .sv-fecho .btn');
      if (!cta || !alvos.length || !('IntersectionObserver' in window)) return;
      var vistos = new Set();
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.isIntersecting ? vistos.add(e.target) : vistos.delete(e.target); });
        cta.classList.toggle('sv-cta-movel--oculto', vistos.size > 0);
      });
      alvos.forEach(function (a) { io.observe(a); });
    })();
  </script>
</body>
</html>
`;
}

const ORG = { '@type': 'Organization', name: 'Corvo Azul', url: `${SITE}/`, email: 'contato@corvoazul.com' };

const CONDICOES = {
  projeto: [
    ['Preço fechado antes de começar', 'A proposta diz o que entra, o que não entra, o preço e as datas de início e entrega. Nada é cobrado sem estar escrito lá.'],
    ['Até 2 rodadas de ajuste', 'Sobre a primeira versão. Pedido novo fora do combinado é orçado à parte, com sua aprovação antes.'],
    ['90 dias de garantia', 'Qualquer erro no que foi entregue é corrigido sem custo nos 90 dias depois da entrega.'],
    ['Tudo no seu nome', 'Depois do pagamento, site, conteúdo, domínio e todos os acessos ficam com você.'],
    ['7 dias para desistir', 'Se você contrata como pessoa física, pode desistir em até 7 dias e recebe de volta tudo o que pagou.'],
  ],
  mensal: [
    ['Sem fidelidade', 'Cancela quando quiser, com 30 dias de aviso.'],
    ['Tudo no seu nome', 'Domínio, hospedagem e acessos continuam seus. Se cancelar, nada fica preso.'],
    ['Resposta em até 1 dia útil', 'Pedidos pelo WhatsApp ou e-mail.'],
    ['Preço combinado por escrito', 'O que entra no plano e o valor ficam na proposta.'],
  ],
};

// ---- página de um serviço ----
function pagina(s) {
  const url = `${SITE}/servicos/${s.slug}/`;
  const link = wa(msg(s));
  const rotuloCTA = s.tipo === 'gratis' ? 'Pedir diagnóstico grátis' : 'Pedir orçamento';
  const outros = servicos.filter((o) => o.slug !== s.slug);
  const m = s.mercado;
  const mercado = `<p class="sv-valor">${esc(m.mediana)}</p>
            <p>Mediana de ${esc(m.amostra)} pesquisadas em outubro de 2026${m.faixa ? `; metade delas fica entre ${esc(m.faixa)}` : ''}.${m.obs ? ` ${esc(m.obs)}` : ''}</p>`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.nome,
    description: s.resumo,
    url,
    provider: ORG,
    areaServed: { '@type': 'Country', name: 'Brasil' },
    offers: { '@type': 'Offer', priceCurrency: 'BRL', price: s.preco_min, description: s.faixa },
  };
  const condicoes = CONDICOES[s.tipo];

  return `${cabeca({ titulo: `${s.titulo_seo} — Corvo Azul`, descricao: `${s.resumo} Preço ${s.preco}.`, url, jsonld })}
<body class="sv">
${topo(link)}

  <main id="conteudo">
    <section class="sv-hero">
      <div class="sv-hero__texto">
        <a class="sv-migalha" href="/servicos/">${VOLTA}<span>Todos os serviços</span></a>
        <p class="rotulo">Serviço ${num(s.n)}</p>
        <h1>${esc(s.nome)}</h1>
        <p class="lead">${esc(s.resumo)}</p>
        <ul class="tags"><li>${esc(s.preco)}</li><li>${esc(s.prazo)}</li></ul>
        <div class="sv-acoes">
          <a class="btn btn--primario" href="${link}" target="_blank" rel="noopener"><span>${rotuloCTA}</span>${SETA}</a>
          <a class="btn btn--fantasma" href="#como">Como funciona</a>
        </div>
      </div>
      <div class="eixo__visual sv-visual" data-glow="${s.n}">
        <span class="eixo__num">${num(s.n)}</span>
        ${glifoSVG(s.n)}
      </div>
    </section>

    <section class="sv-bloco" aria-labelledby="t-preco">
      <h2 id="t-preco">Quanto custa</h2>
      <div class="sv-precos">
        <div class="sv-caixa sv-caixa--nosso">
          <p class="sv-caixa__rotulo">Nosso preço</p>
          <p class="sv-valor">${esc(s.preco)}</p>
          <p>${esc(s.faixa)}.</p>
        </div>
        <div class="sv-caixa">
          <p class="sv-caixa__rotulo">Preço médio no mercado</p>
          ${mercado}
        </div>
        <div class="sv-caixa">
          <p class="sv-caixa__rotulo">${s.tipo === 'gratis' ? 'Prazo' : 'Prazo e pagamento'}</p>
          <p class="sv-valor sv-valor--menor">${esc(s.prazo)}</p>
          <p>${s.tipo === 'gratis' ? '' : `${esc(s.pagamento)} `}${esc(s.prazo_nota)}</p>
        </div>
      </div>
      <p class="sv-nota">O preço médio vem de ofertas públicas de agências, freelancers e plataformas, abertas uma a uma em outubro de 2026. Mediana quer dizer que metade das ofertas cobra menos e metade cobra mais. ${s.tipo === 'gratis' ? '' : 'O seu preço final sai na proposta, depois de uma conversa rápida, e não muda depois de aceito.'}</p>
    </section>

    <section class="sv-bloco" aria-labelledby="t-inclui">
      <h2 id="t-inclui">O que está incluído</h2>
      <ul class="sv-lista">
${s.inclui.map((i) => `        <li>${esc(i)}</li>`).join('\n')}
      </ul>
    </section>

    <section class="sv-bloco" id="como" aria-labelledby="t-como">
      <h2 id="t-como">Como fazemos</h2>
      <ol class="sv-passos">
${s.como.map(([t, d], i) => `        <li><span class="sv-passos__n">${num(i + 1)}</span><div><h3>${esc(t)}</h3><p>${esc(d)}</p></div></li>`).join('\n')}
      </ol>
    </section>

    <section class="sv-bloco" aria-labelledby="t-nao">
      <h2 id="t-nao">O que não está incluído</h2>
      <ul class="sv-lista sv-lista--nao">
${s.nao_inclui.map((i) => `        <li>${esc(i)}</li>`).join('\n')}
      </ul>
    </section>
${condicoes ? `
    <section class="sv-bloco" aria-labelledby="t-cond">
      <h2 id="t-cond">O que fica combinado</h2>
      <dl class="sv-condicoes">
${condicoes.map(([t, d]) => `        <div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('\n')}
      </dl>
    </section>
` : ''}
    <section class="sv-fecho">
      <p class="rotulo">${s.tipo === 'gratis' ? 'Sem compromisso' : 'Orçamento sem compromisso'}</p>
      <h2>${s.tipo === 'gratis' ? 'Mande o nome do seu negócio.' : 'Conte o que o seu negócio faz.'}</h2>
      <p class="lead">${s.tipo === 'gratis' ? 'E a cidade. O resumo chega em até 2 dias úteis.' : 'A resposta chega em até 1 dia útil, com proposta de preço fechado.'}</p>
      <a class="btn btn--primario btn--grande" href="${link}" target="_blank" rel="noopener"><span>${rotuloCTA} pelo WhatsApp</span>${SETA}</a>
    </section>

    <section class="sv-outros" aria-labelledby="t-outros">
      <h2 id="t-outros">Outros serviços</h2>
      <ul>
${outros.map((o) => `        <li><a href="/servicos/${o.slug}/"><span class="sv-outros__n">${num(o.n)}</span><span class="sv-outros__nome">${esc(nomeCurto(o))}</span><span class="sv-outros__preco">${esc(o.preco)}</span></a></li>`).join('\n')}
      </ul>
    </section>
  </main>

${rodape(link, rotuloCTA)}`;
}

// ---- /servicos/ ----
function indice() {
  const url = `${SITE}/servicos/`;
  const link = wa('Olá! Vim pelo site e quero um orçamento.');
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Serviços do Corvo Azul',
    itemListElement: servicos.map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/servicos/${s.slug}/`, name: s.nome })),
  };
  return `${cabeca({ titulo: 'Serviços e preços — Corvo Azul', descricao: 'Perfil no Google, landing page, site, loja virtual, Mercado Livre e Shopee, pagamento online e manutenção, com preço de partida, prazo e o preço médio do mercado.', url, jsonld })}
<body class="sv">
${topo(link)}

  <main id="conteudo">
    <section class="sv-hero sv-hero--lista">
      <div class="sv-hero__texto">
        <p class="rotulo">Serviços</p>
        <h1>O que dá para fazer pelo seu negócio.</h1>
        <p class="lead">Cada serviço tem preço de partida, prazo e o preço médio do mercado ao lado, para você comparar. O preço final sai fechado na proposta.</p>
      </div>
    </section>
    <section class="eixos eixos--lista">
      <div class="eixos__grade">
${servicos.map((s) => card(s, true)).join('\n')}
      </div>
    </section>
  </main>

${rodape(link)}`;
}

// ---- escreve ----
for (const s of servicos) {
  const dir = join(AQUI, s.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), pagina(s));
}
writeFileSync(join(AQUI, 'index.html'), indice());

const homeArq = join(RAIZ, 'index.html');
const home = readFileSync(homeArq, 'utf8');
const ini = '<!-- servicos:inicio -->', fim = '<!-- servicos:fim -->';
if (!home.includes(ini) || !home.includes(fim)) throw new Error('marcadores dos serviços não encontrados no index.html');
const novo = home.replace(new RegExp(`${ini}[\\s\\S]*?${fim}`), `${ini}\n      <div class="eixos__grade">\n${servicos.map((s) => card(s, false)).join('\n')}\n      </div>\n      ${fim}`);
writeFileSync(homeArq, novo);

console.log(`gerado: ${servicos.length} páginas de serviço, /servicos/ e os cards da home`);
