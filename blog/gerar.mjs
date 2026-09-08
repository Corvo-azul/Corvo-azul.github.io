// Gera, a partir de posts.json, o que precisa existir como ARQUIVO para o buscador:
//   /blog/tag/<tag>/index.html   páginas de tag (o filtro por JS não é indexável)
//   /blog/arquivo/index.html     lista cronológica completa
//   /blog/feed.xml               RSS
//   /sitemap.xml                 home + site + todas as páginas do blog
//
// Rodar: node blog/gerar.mjs   (a partir de site-deploy/)
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..');
const SITE = 'https://corvoazul.com';

const posts = JSON.parse(readFileSync(join(AQUI, 'posts.json'), 'utf8'))
  .slice()
  .sort((a, b) => (a.data < b.data ? 1 : -1));

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dataBr = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// O <head> e o topo saem do index.html real, para não existir um segundo template
// que precise ser atualizado junto sempre que o blog mudar.
const modelo = readFileSync(join(AQUI, 'index.html'), 'utf8');
const topo = modelo.slice(modelo.indexOf('<header'), modelo.indexOf('</header>') + 9);
const canal = '<div class="blog__canal" data-canal-slot></div>';

function pagina({ base, titulo, descricao, url, h1, sub, itens }) {
  return `<!DOCTYPE html>
<html lang="pt-BR" data-blog-base="${base}">
<head>
  <meta charset="UTF-8">
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-PVCC35T5');</script>
  <!-- End Google Tag Manager -->
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(titulo)}</title>
  <meta name="description" content="${esc(descricao)}">
  <link rel="canonical" href="${url}">
  <link rel="alternate" type="application/rss+xml" title="Corvo Azul — Blog" href="${SITE}/blog/feed.xml">
  <link rel="icon" type="image/svg+xml" href="${base}/../assets/favicon.svg">
  <link rel="shortcut icon" href="${base}/../assets/favicon-32.png">
  <link rel="stylesheet" href="${base}/../assets/fonts/fonts.css">
  <link rel="stylesheet" href="${base}/estilo.css">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Corvo Azul">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(titulo)}">
  <meta property="og:description" content="${esc(descricao)}">
  <meta property="og:image" content="${SITE}/assets/og.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(titulo)}">
  <meta name="twitter:description" content="${esc(descricao)}">
  <meta name="twitter:image" content="${SITE}/assets/og.jpg">
  <meta name="yandex-verification" content="e96e78913d7ec786">
</head>
<body class="blog">
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PVCC35T5"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->
${topo.replace('href="/blog/"', `href="${base}/"`)}

  ${canal}

  <main class="blog__container blog__container--largo">
    <h1>${esc(h1)}</h1>
    <p>${esc(sub)}</p>
    <div class="blog__lista">
${itens}
    </div>
    <p style="margin-top:2.5rem"><a href="${base}/" style="font-family:var(--mono);font-size:.82rem;color:var(--acento)">← todos os posts</a></p>
  </main>

  <script src="${base}/script.js"></script>
</body>
</html>
`;
}

const item = (p, base) => `      <a class="blog__item" href="${base}/${p.slug}/" data-post-item data-tags="${(p.tags || []).join(',')}">
        <time datetime="${p.data}">${dataBr(p.data)}</time>
        <h2>${esc(p.titulo)}</h2>
        <p>${esc(p.resumo)}</p>
        <div class="tags">${(p.tags || []).map((t) => `<span>#${esc(t)}</span>`).join('')}</div>
      </a>`;

// ---- páginas de tag ----
const tags = [...new Set(posts.flatMap((p) => p.tags || []))].sort();
if (existsSync(join(AQUI, 'tag'))) rmSync(join(AQUI, 'tag'), { recursive: true, force: true });
for (const t of tags) {
  const dela = posts.filter((p) => (p.tags || []).includes(t));
  const dir = join(AQUI, 'tag', t);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), pagina({
    base: '../..',
    titulo: `#${t} — Blog Corvo Azul`,
    descricao: `Posts sobre ${t}: tutoriais práticos de IA no dia a dia, com print de tela.`,
    url: `${SITE}/blog/tag/${t}/`,
    h1: `#${t}`,
    sub: `${dela.length} ${dela.length === 1 ? 'post' : 'posts'} com esta tag.`,
    itens: dela.map((p) => item(p, '../..')).join('\n'),
  }));
}

// ---- arquivo ----
mkdirSync(join(AQUI, 'arquivo'), { recursive: true });
writeFileSync(join(AQUI, 'arquivo', 'index.html'), pagina({
  base: '..',
  titulo: 'Arquivo — Blog Corvo Azul',
  descricao: 'Todos os posts do blog do Corvo Azul, do mais recente ao mais antigo.',
  url: `${SITE}/blog/arquivo/`,
  h1: 'Arquivo',
  sub: `Todos os ${posts.length} ${posts.length === 1 ? 'post' : 'posts'}, do mais recente ao mais antigo.`,
  itens: posts.map((p) => item(p, '..')).join('\n'),
}));

// ---- RSS ----
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Corvo Azul — Blog</title>
    <link>${SITE}/blog/</link>
    <description>Tutoriais práticos de IA no dia a dia, com print de tela. Sem curso, sem hype.</description>
    <language>pt-BR</language>
    <atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml"/>
${posts.map((p) => `    <item>
      <title>${esc(p.titulo)}</title>
      <link>${SITE}/blog/${p.slug}/</link>
      <guid isPermaLink="true">${SITE}/blog/${p.slug}/</guid>
      <pubDate>${new Date(p.data + 'T12:00:00Z').toUTCString()}</pubDate>
      <description>${esc(p.resumo)}</description>
${(p.tags || []).map((t) => `      <category>${esc(t)}</category>`).join('\n')}
    </item>`).join('\n')}
  </channel>
</rss>
`;
writeFileSync(join(AQUI, 'feed.xml'), rss);

// ---- sitemap (site + blog inteiro) ----
const hoje = new Date().toISOString().slice(0, 10);
const urls = [
  { loc: `${SITE}/`, mod: hoje, freq: 'weekly', pri: '1.0' },
  { loc: `${SITE}/blog/`, mod: posts[0]?.data || hoje, freq: 'weekly', pri: '0.9' },
  { loc: `${SITE}/blog/arquivo/`, mod: posts[0]?.data || hoje, freq: 'monthly', pri: '0.5' },
  ...posts.map((p) => ({ loc: `${SITE}/blog/${p.slug}/`, mod: p.atualizado || p.data, freq: 'monthly', pri: '0.8' })),
  ...tags.map((t) => ({ loc: `${SITE}/blog/tag/${t}/`, mod: posts[0]?.data || hoje, freq: 'monthly', pri: '0.6' })),
];
writeFileSync(join(RAIZ, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.mod}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pri}</priority>
  </url>`).join('\n')}
</urlset>
`);

console.log(`gerado: ${tags.length} página(s) de tag, arquivo, feed.xml e sitemap com ${urls.length} URLs`);
