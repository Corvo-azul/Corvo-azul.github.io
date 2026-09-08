// Notifica os buscadores que suportam o protocolo IndexNow (Bing, Yandex, Seznam, Naver)
// sempre que o site publicar conteudo novo ou atualizado. Le as URLs direto do
// sitemap.xml, entao roda `node blog/gerar.mjs` primeiro se algo mudou.
//
// Uso: node blog/indexnow-ping.mjs
// Roda depois do `git push` (as URLs precisam estar ao vivo pro Bing validar a chave).

const HOST = "corvoazul.com";
const KEY = "8e2ebacecdd9921ffd96de048cfc920b";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

async function main() {
  const sitemapUrl = `https://${HOST}/sitemap.xml`;
  const res = await fetch(sitemapUrl);
  if (!res.ok) throw new Error(`Nao consegui ler ${sitemapUrl}: ${res.status}`);
  const xml = await res.text();
  const urlList = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

  if (urlList.length === 0) throw new Error("Sitemap sem URLs — nada pra avisar.");

  console.log(`Avisando IndexNow sobre ${urlList.length} URL(s):`);
  urlList.forEach((u) => console.log("  " + u));

  const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList };

  const ping = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  console.log(`\nStatus: ${ping.status} ${ping.statusText}`);
  if (ping.status === 200 || ping.status === 202) {
    console.log("Aceito — Bing/Yandex/Seznam/Naver vão buscar essas URLs em breve.");
  } else {
    const text = await ping.text().catch(() => "");
    console.log("Resposta:", text || "(sem corpo)");
  }
}

main().catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});
