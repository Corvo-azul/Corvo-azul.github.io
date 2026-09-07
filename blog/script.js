// Corvo Azul — Blog: tema (claro/escuro/sistema), idioma (pt/en, só chrome da UI por ora),
// leitor de voz (Web Speech API), sumário automático, faixa de canal/vídeo mais recente.
(function () {
  "use strict";

  var CHAVE_TEMA = "ca-blog-tema";
  var CHAVE_IDIOMA = "ca-blog-idioma";

  function resolverTema(pref) {
    if (pref === "claro" || pref === "escuro") return pref;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
  }

  function aplicarTema(pref) {
    var resolvido = resolverTema(pref);
    document.documentElement.setAttribute("data-theme-resolvido", resolvido);
    document.querySelectorAll("[data-tema-botao]").forEach(function (b) {
      b.classList.toggle("ativo", b.getAttribute("data-tema-botao") === pref);
    });
  }

  function initTema() {
    var pref = localStorage.getItem(CHAVE_TEMA) || "sistema";
    aplicarTema(pref);
    document.querySelectorAll("[data-tema-botao]").forEach(function (b) {
      b.addEventListener("click", function () {
        pref = b.getAttribute("data-tema-botao");
        localStorage.setItem(CHAVE_TEMA, pref);
        aplicarTema(pref);
      });
    });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if ((localStorage.getItem(CHAVE_TEMA) || "sistema") === "sistema") aplicarTema("sistema");
    });
  }

  // Idioma: troca só os textos de interface (nav, botões, rótulos) via data-i18n-pt/en.
  // O corpo do post continua só em PT até termos tradução real — ver data-i18n-post-en opcional.
  function initIdioma() {
    var idioma = localStorage.getItem(CHAVE_IDIOMA) || "pt";
    function aplicar(id) {
      idioma = id;
      document.documentElement.lang = id === "en" ? "en" : "pt-BR";
      document.querySelectorAll("[data-i18n-ph-pt]").forEach(function (el) {
        var ph = el.getAttribute(id === "en" ? "data-i18n-ph-en" : "data-i18n-ph-pt");
        if (ph) el.setAttribute("placeholder", ph);
      });
      document.querySelectorAll("[data-i18n-pt]").forEach(function (el) {
        var texto = el.getAttribute(id === "en" ? "data-i18n-en" : "data-i18n-pt");
        if (texto) el.textContent = texto;
      });
      var corpoEn = document.querySelector("[data-post-corpo-en]");
      var corpoPt = document.querySelector("[data-post-corpo-pt]");
      if (corpoEn && corpoPt) {
        var temEn = corpoEn.hasAttribute("data-disponivel");
        corpoPt.hidden = id === "en" && temEn;
        corpoEn.hidden = !(id === "en" && temEn);
      }
      document.querySelectorAll("[data-idioma-botao]").forEach(function (b) {
        b.classList.toggle("ativo", b.getAttribute("data-idioma-botao") === id);
      });
      // O botão de ouvir troca o próprio texto ao falar: os rótulos das duas
      // fases precisam acompanhar o idioma, senão ele volta ao português ao parar.
      var ouvir = document.querySelector("[data-ouvir]");
      if (ouvir) {
        var d = ouvir.dataset;
        d.rotuloAtivoOuvir = id === "en" && d.rotuloOuvirEn ? d.rotuloOuvirEn : d.rotuloOuvir;
        d.rotuloAtivoParar = id === "en" && d.rotuloPararEn ? d.rotuloPararEn : d.rotuloParar;
        if (!ouvir.dataset.falando) ouvir.textContent = d.rotuloAtivoOuvir;
      }
      localStorage.setItem(CHAVE_IDIOMA, id);
    }
    window.__blogAplicarIdioma = function () { aplicar(idioma); };
    document.querySelectorAll("[data-idioma-botao]").forEach(function (b) {
      b.addEventListener("click", function () { aplicar(b.getAttribute("data-idioma-botao")); });
    });
    aplicar(idioma);
  }

  // Botão "ouvir" — Web Speech API. Qualidade da voz depende do navegador/SO de quem visita;
  // nem todo Android/Chrome tem voz PT-BR boa instalada — isso não dá pra controlar daqui.
  function initOuvir() {
    var botao = document.querySelector("[data-ouvir]");
    if (!botao) return;
    if (!("speechSynthesis" in window)) { botao.hidden = true; return; }
    var falando = false;
    botao.addEventListener("click", function () {
      if (falando) { window.speechSynthesis.cancel(); falando = false; delete botao.dataset.falando; botao.textContent = botao.dataset.rotuloAtivoOuvir || botao.dataset.rotuloOuvir; return; }
      var corpo = document.querySelector("[data-post-corpo-pt]:not([hidden])") || document.querySelector("[data-post-corpo-pt]");
      if (!corpo) return;
      var utter = new SpeechSynthesisUtterance(corpo.innerText);
      utter.lang = "pt-BR";
      utter.onend = function () { falando = false; delete botao.dataset.falando; botao.textContent = botao.dataset.rotuloAtivoOuvir || botao.dataset.rotuloOuvir; };
      window.speechSynthesis.speak(utter);
      falando = true;
      botao.dataset.falando = "1";
      botao.textContent = botao.dataset.rotuloAtivoParar || botao.dataset.rotuloParar;
    });
  }

  // Sumário automático a partir dos H2 do corpo do post.
  function initSumario() {
    var lista = document.querySelector("[data-sumario-lista]");
    var corpo = document.querySelector("[data-post-corpo-pt]");
    if (!lista || !corpo) return;
    var h2s = corpo.querySelectorAll("h2");
    if (!h2s.length) { var bloco = document.querySelector("[data-sumario]"); if (bloco) bloco.hidden = true; return; }
    h2s.forEach(function (h, i) {
      var id = "sec-" + (i + 1);
      h.id = id;
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + id; a.textContent = h.textContent;
      li.appendChild(a); lista.appendChild(li);
    });
  }

  // Faixa de canal + vídeo mais recente, lida de blog/config.json (relativo à raiz do blog).
  function initCanal() {
    var alvos = document.querySelectorAll("[data-canal-slot]");
    if (!alvos.length) return;
    var base = document.documentElement.getAttribute("data-blog-base") || ".";
    function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    fetch(base + "/config.json").then(function (r) { return r.json(); }).then(function (cfg) {
      // Os rótulos entram com data-i18n para que o botão PT/EN também os alcance.
      alvos.forEach(function (el) {
        el.innerHTML =
          '<a href="' + esc(cfg.canal_url) + '" target="_blank" rel="noopener"' +
            ' data-i18n-pt="▶ Canal Corvo Azul" data-i18n-en="▶ Corvo Azul channel">▶ Canal Corvo Azul</a>' +
          '<span>·</span>' +
          '<a href="' + esc(cfg.ultimo_video.url) + '" target="_blank" rel="noopener"' +
            ' data-i18n-pt="Vídeo mais recente: ' + esc(cfg.ultimo_video.titulo) + '"' +
            ' data-i18n-en="Latest video: ' + esc(cfg.ultimo_video.titulo_en || cfg.ultimo_video.titulo) + '">' +
            'Vídeo mais recente: ' + esc(cfg.ultimo_video.titulo) + '</a>';
      });
      // A faixa chega depois do primeiro aplicar(); reaplica para não ficar só em português.
      if (typeof window.__blogAplicarIdioma === "function") window.__blogAplicarIdioma();
    }).catch(function () {});
  }

  // Filtro de tags por ?tag= na lista do blog.
  function initFiltroTags() {
    var chips = document.querySelectorAll("[data-tag-chip]");
    var itens = document.querySelectorAll("[data-post-item]");
    if (!chips.length || !itens.length) return;
    var params = new URLSearchParams(location.search);
    var atual = params.get("tag");
    function aplicar(tag) {
      chips.forEach(function (c) { c.classList.toggle("ativo", c.getAttribute("data-tag-chip") === tag); });
      var achou = 0;
      itens.forEach(function (it) {
        var tags = (it.getAttribute("data-tags") || "").split(",");
        var bate = !tag || tags.indexOf(tag) !== -1;
        it.hidden = !bate;
        if (bate) achou++;
      });
      mostrarVazio(!!tag && achou === 0, tag, "tag");
    }
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var tag = c.getAttribute("data-tag-chip");
        var novo = atual === tag ? null : tag;
        atual = novo;
        var url = new URL(location.href);
        if (novo) url.searchParams.set("tag", novo); else url.searchParams.delete("tag");
        history.replaceState(null, "", url);
        aplicar(novo);
      });
    });
    aplicar(atual);
  }


  /* ---------- Estado vazio do filtro ----------
     Antes a lista colapsava para altura zero e a pagina parecia cortada. */
  function mostrarVazio(mostrar, termo, tipo) {
    var lista = document.querySelector(".blog__lista");
    if (!lista) return;
    var aviso = lista.querySelector(".blog__vazio");
    if (!mostrar) { if (aviso) aviso.remove(); return; }
    if (!aviso) {
      aviso = document.createElement("div");
      aviso.className = "blog__vazio";
      lista.appendChild(aviso);
    }
    var en = document.documentElement.lang === "en";
    var frase = tipo === "busca"
      ? (en ? 'No posts match "' : 'Nenhum post encontrado para "') + termo + '".'
      : (en ? "No posts tagged #" : "Nenhum post com a tag #") + termo + (en ? " yet." : " ainda.");
    aviso.innerHTML = "<span>" + frase + "</span><br>" +
      '<button type="button" data-limpar-filtro>' + (en ? "Show all" : "Ver todos") + "</button>";
    aviso.querySelector("[data-limpar-filtro]").addEventListener("click", function () {
      var campo = document.querySelector("[data-busca]");
      if (tipo === "busca" && campo) {
        campo.value = "";
        campo.dispatchEvent(new Event("input"));
        return;
      }
      var url = new URL(location.href); url.searchParams.delete("tag");
      location.href = url.toString();
    });
  }

  /* ---------- Busca por texto ---------- */
  function initBusca() {
    var campo = document.querySelector("[data-busca]");
    var itens = document.querySelectorAll("[data-post-item]");
    if (!campo || !itens.length) return;
    campo.addEventListener("input", function () {
      var q = campo.value.trim().toLowerCase();
      var achou = 0;
      itens.forEach(function (it) {
        var texto = (it.innerText + " " + (it.getAttribute("data-tags") || "")).toLowerCase();
        var bate = !q || texto.indexOf(q) !== -1;
        it.hidden = !bate;
        if (bate) achou++;
      });
      mostrarVazio(!!q && achou === 0, q, "busca");
    });
  }

  /* ---------- Barra de progresso de leitura (so no post) ---------- */
  function initProgresso() {
    var artigo = document.querySelector("[data-post-corpo-pt]");
    if (!artigo) return;
    var barra = document.createElement("div");
    barra.className = "progresso-leitura";
    document.body.appendChild(barra);
    function atualizar() {
      // Artigo mais curto que a tela: o progresso passa a ser o da PAGINA,
      // senao a barra ficaria travada em 0% do inicio ao fim.
      var r = artigo.getBoundingClientRect();
      var vao = r.height - window.innerHeight;
      var lido;
      if (vao > 40) {
        lido = Math.min(1, Math.max(0, -r.top / vao));
      } else {
        var rolavel = document.documentElement.scrollHeight - window.innerHeight;
        lido = rolavel > 0 ? Math.min(1, Math.max(0, window.scrollY / rolavel)) : 0;
      }
      barra.style.width = (lido * 100).toFixed(1) + "%";
    }
    window.addEventListener("scroll", atualizar, { passive: true });
    window.addEventListener("resize", atualizar);
    atualizar();
  }

  /* ---------- Prints ampliaveis ----------
     Tutorial vive de detalhe de tela; a imagem so na largura do texto nao serve. */
  function initLupa() {
    var artigo = document.querySelector("[data-post-corpo-pt]");
    if (!artigo) return;
    artigo.addEventListener("click", function (e) {
      var img = e.target.closest("img");
      if (!img) return;
      var cx = document.createElement("div");
      cx.className = "lupa";
      cx.innerHTML = '<button class="lupa__fechar" aria-label="Fechar">✕</button>';
      var grande = document.createElement("img");
      grande.src = img.currentSrc || img.src;
      grande.alt = img.alt || "";
      cx.appendChild(grande);
      function fechar() { cx.remove(); document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; }
      function onKey(ev) { if (ev.key === "Escape") fechar(); }
      cx.addEventListener("click", fechar);
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      document.body.appendChild(cx);
    });
  }

  /* ---------- Copiar bloco de comando ---------- */
  function initCopiar() {
    document.querySelectorAll("article pre").forEach(function (pre) {
      if (pre.parentElement.classList.contains("bloco-codigo")) return;
      var caixa = document.createElement("div");
      caixa.className = "bloco-codigo";
      pre.parentNode.insertBefore(caixa, pre);
      caixa.appendChild(pre);
      var b = document.createElement("button");
      b.className = "copiar"; b.type = "button";
      var rotulo = document.documentElement.lang === "en" ? "copy" : "copiar";
      b.textContent = rotulo;
      b.addEventListener("click", function () {
        navigator.clipboard.writeText(pre.innerText).then(function () {
          b.textContent = document.documentElement.lang === "en" ? "copied" : "copiado";
          setTimeout(function () { b.textContent = rotulo; }, 1600);
        }).catch(function () { b.textContent = "erro"; });
      });
      caixa.appendChild(b);
    });
  }

  /* ---------- Compartilhar ---------- */
  function initCompartilhar() {
    var alvo = document.querySelector("[data-compartilhar]");
    if (!alvo) return;
    var url = location.href.split("#")[0];
    var titulo = document.title;
    var en = function () { return document.documentElement.lang === "en"; };
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = en() ? "copy link" : "copiar link";
    btn.addEventListener("click", function () {
      navigator.clipboard.writeText(url).then(function () {
        btn.textContent = en() ? "copied" : "copiado";
        setTimeout(function () { btn.textContent = en() ? "copy link" : "copiar link"; }, 1600);
      }).catch(function () {});
    });
    alvo.appendChild(btn);
    var wa = document.createElement("a");
    wa.href = "https://wa.me/?text=" + encodeURIComponent(titulo + " " + url);
    wa.target = "_blank"; wa.rel = "noopener"; wa.textContent = "WhatsApp";
    alvo.appendChild(wa);
    // Menu nativo do sistema quando existir (celular)
    if (navigator.share) {
      var nativo = document.createElement("button");
      nativo.type = "button";
      nativo.textContent = en() ? "share…" : "compartilhar…";
      nativo.addEventListener("click", function () { navigator.share({ title: titulo, url: url }).catch(function () {}); });
      alvo.appendChild(nativo);
    }
  }

  /* ---------- Posts relacionados (tags em comum) ---------- */
  function initRelacionados() {
    var alvo = document.querySelector("[data-relacionados]");
    if (!alvo) return;
    var base = document.documentElement.getAttribute("data-blog-base") || ".";
    var slugAtual = alvo.getAttribute("data-slug-atual") || "";
    var minhas = (alvo.getAttribute("data-tags") || "").split(",").filter(Boolean);
    fetch(base + "/posts.json").then(function (r) { return r.json(); }).then(function (posts) {
      var pontuados = posts
        .filter(function (p) { return p.slug !== slugAtual; })
        .map(function (p) { return { p: p, n: (p.tags || []).filter(function (t) { return minhas.indexOf(t) !== -1; }).length }; })
        .filter(function (x) { return x.n > 0; })
        .sort(function (a, b) { return b.n - a.n || (a.p.data < b.p.data ? 1 : -1); })
        .slice(0, 3);
      if (!pontuados.length) { alvo.hidden = true; return; }  // 1 post só: some, não fica vazio
      var en = document.documentElement.lang === "en";
      alvo.innerHTML = "<h2>" + (en ? "Related posts" : "Posts relacionados") + "</h2>" +
        pontuados.map(function (x) {
          return '<a href="' + base + "/" + x.p.slug + '/"><h3>' + x.p.titulo + "</h3><p>" + (x.p.resumo || "") + "</p></a>";
        }).join("");
      alvo.hidden = false;
    }).catch(function () { alvo.hidden = true; });
  }

  /* ---------- CTA do quiz ----------
     So aparece se config.json tiver quiz_url; sem isso, nada e inventado. */
  function initQuiz() {
    var alvo = document.querySelector("[data-quiz]");
    if (!alvo) return;
    var base = document.documentElement.getAttribute("data-blog-base") || ".";
    fetch(base + "/config.json").then(function (r) { return r.json(); }).then(function (cfg) {
      if (!cfg.quiz || !cfg.quiz.url) { alvo.hidden = true; return; }
      var en = document.documentElement.lang === "en";
      alvo.innerHTML =
        "<h2>" + (en ? (cfg.quiz.titulo_en || cfg.quiz.titulo) : cfg.quiz.titulo) + "</h2>" +
        "<p>" + (en ? (cfg.quiz.texto_en || cfg.quiz.texto) : cfg.quiz.texto) + "</p>" +
        '<a href="' + cfg.quiz.url + '" target="_blank" rel="noopener">' +
        (en ? (cfg.quiz.botao_en || cfg.quiz.botao) : cfg.quiz.botao) + "</a>";
      alvo.hidden = false;
    }).catch(function () { alvo.hidden = true; });
  }

  /* ---------- Sumario: destaca a seção atual (a coluna fixa em tela larga) ---------- */
  function initSumarioAtivo() {
    var links = document.querySelectorAll("[data-sumario-lista] a");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var mapa = {};
    links.forEach(function (a) { var id = a.getAttribute("href").slice(1); if (id) mapa[id] = a; });
    var obs = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.remove("ativo"); });
          if (mapa[e.target.id]) mapa[e.target.id].classList.add("ativo");
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    Object.keys(mapa).forEach(function (id) { var el = document.getElementById(id); if (el) obs.observe(el); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTema(); initIdioma(); initOuvir(); initSumario(); initCanal(); initFiltroTags();
    initBusca(); initProgresso(); initLupa(); initCopiar();
    initCompartilhar(); initRelacionados(); initQuiz(); initSumarioAtivo();
  });
})();
