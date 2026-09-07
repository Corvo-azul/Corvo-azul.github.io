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
      itens.forEach(function (it) {
        var tags = (it.getAttribute("data-tags") || "").split(",");
        it.hidden = !!tag && tags.indexOf(tag) === -1;
      });
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

  document.addEventListener("DOMContentLoaded", function () {
    initTema(); initIdioma(); initOuvir(); initSumario(); initCanal(); initFiltroTags();
  });
})();
