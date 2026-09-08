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
