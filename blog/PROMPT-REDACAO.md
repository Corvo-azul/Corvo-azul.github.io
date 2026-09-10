# Prompt de redação do blog

Todo texto do blog do Corvo Azul é escrito sob este prompt. Ele vale para post novo e para revisão de post existente.

```
Aja como um redator humano e autêntico. Escreva de forma conversacional, clara e
objetiva, como se estivesse falando com um amigo inteligente. Varie o tamanho das
frases, misture tons casuais com profissionais e use um ritmo natural de fala.
Nunca utilize travessões longos, palavras rebuscadas em excesso, termos clichês de
IA (como "no vasto cenário", "é importante ressaltar", "além disso") ou formatações
robóticas. Foque em contar uma ideia de forma simples e direta.
```

## Como conferir antes de publicar

O único item mecanicamente verificável é o travessão longo. A partir de `site-deploy/`:

```bash
grep -n "—" blog/*/index.html
```

O resultado esperado é só as ocorrências no `<head>`, onde o travessão separa o título do post do nome do site (`Título — Corvo Azul`). Essa é convenção de título de página, não texto corrido, e é a mesma do site inteiro. Qualquer ocorrência dentro de `<article>` é erro.

O resto depende de leitura. Os sinais que mais aparecem quando o texto escorrega:

- parágrafo que abre com "Além disso", "Vale ressaltar", "Em suma";
- três frases seguidas do mesmo tamanho;
- adjetivo empilhado onde um só resolveria;
- explicação do que o leitor vai ler em vez da coisa em si.

## Versão em inglês, obrigatória a partir de 10/09

Todo post publicado precisa nascer com par em inglês, não como pendência para depois. Isso significa preencher, no mesmo lote em que o post é escrito:

1. **`posts.json`**: `titulo_en` e `resumo_en`, ao lado de `titulo`/`resumo`.
2. **`blog/index.html`**: o card do post na lista ganha `data-i18n-pt`/`data-i18n-en` no `<h2>` e no `<p>`, com os mesmos textos do item 1.
3. **`blog/<slug>/index.html`**: o `<article data-post-corpo-en>` que hoje existe como esqueleto (copie a estrutura de `<article data-post-corpo-pt>`, mesmos `<h2>` na mesma ordem, mesmas imagens) ganha o atributo **`data-disponivel`** e o texto traduzido. Sem esse atributo, o botão EN da página troca só a interface ao redor e o corpo do post fica em português — é exatamente o estado que existia até 10/09 e que o `gerar.mjs` agora acusa.
4. **`<title>`** e **`<h1>`** do post ganham `data-i18n-pt`/`data-i18n-en` também (a aba do navegador e o título visível trocam de idioma; `description`, Open Graph, Twitter e JSON-LD ficam fixos em português de propósito, porque só crawler os lê e crawler não roda o botão PT/EN).

A tradução não precisa ser literal frase a frase — segue o mesmo prompt de redação acima, só que em inglês: conversacional, sem clichê de IA, sem travessão longo dentro do `<article>` (a regra mecânica do item anterior vale para os dois idiomas, e o guarda do `gerar.mjs` varre do primeiro `<article` ao último `</article>`, cobrindo PT e EN juntos).

`node blog/gerar.mjs` avisa quando um post não tem `titulo_en`/`resumo_en` no `posts.json`, ou quando o `<article data-post-corpo-en data-disponivel>` não existe no HTML. Rodar o gerador faz parte de publicar; se ele reclamar de um post novo, o par em inglês ficou pra trás.

Páginas de tag, arquivo e o feed RSS continuam só em português — não têm par em inglês ainda. É decisão de escopo (poucos posts, ganho de indexação baixo agora), não esquecimento; revisitar quando o blog tiver mais de 4 ou 5 posts.
