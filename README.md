# corvoazul.com

Site do **Corvo Azul**, canal sobre construir software de verdade com IA, usando Claude Code como ferramenta principal. Um vídeo por semana, código aberto.

**No ar:** <https://corvoazul.com>

Uma página, HTML/CSS/JS puro, sem framework e sem etapa de build. Hospedado no GitHub Pages.

---

## Por que sem framework

O site não tem estado, não tem formulário e muda pouco. Um framework aqui traria uma etapa de build e um conjunto de dependências para manter, sem nada em troca. A regra do projeto é que a solução simples que resolve ganha da elegante que impressiona.

Isso tem um custo assumido: as animações vêm de bibliotecas em CDN, e não há empacotamento. A contrapartida está descrita em [Resiliência](#resiliência).

## Estrutura

```
index.html    página única
404.html      página de erro, caminhos absolutos (o Pages a serve em qualquer profundidade)
style.css     tokens da marca + componentes
script.js     animação, terminal simulado, menu mobile, prova do GitHub
assets/       vídeo do topo, fotos, glifo, fontes, ícones, cartão de compartilhamento
CNAME         domínio canônico
.nojekyll     impede o Pages de processar a pasta com Jekyll
robots.txt    + sitemap.xml
```

## Identidade

Definida em `claude/DOC_IDENTIDADE.md`, fora deste repositório. O essencial:

| Token | Valor | Uso |
|---|---|---|
| Grafite | `#07090D` | fundo da página |
| Papel | `#EDE9E1` | texto principal |
| Azul claro | `#7EA2E4` | **único** acento; um lugar por tela |
| Cobre | `#9C6A3F` | só como luz difusa, nunca em texto ou borda |

Bricolage Grotesque nos títulos e no nome da marca, Archivo no texto, IBM Plex Mono nos rótulos e no terminal. As três são servidas deste domínio, em `assets/fonts/`, e não do Google. Isso não é preferência: o link externo bloqueava a renderização por cerca de 870 ms no celular.

O glifo do corvo é vetor, gerado do arquivo canônico. O bico aponta para a direita, olhando para o nome. Os ícones dos quatro eixos são variações desse mesmo desenho, geradas em SVG. Nada de foto de corvo como ícone: pela regra da marca, o corvo é símbolo, não personagem.

## Conteúdo

Nenhum número inventado. Não há contagem de inscritos, depoimento ou prova social, porque o canal está no primeiro dia. Os únicos números são os do próprio experimento, e o registro de atividades marca como pendente o que ainda não existe.

O bloco de prova consulta a interface pública do GitHub para mostrar repositórios e último envio. Essa interface permite sessenta consultas por hora por endereço de internet, e quem acessa por operadora com endereço compartilhado divide essa cota com desconhecidos. Por isso o bloco nunca desaparece: sem resposta, ele mostra uma versão fixa, sem o ponto verde que significaria dado ao vivo.

## Resiliência

Se os servidores das bibliotecas caírem, forem bloqueados por extensão ou barrados por rede corporativa, a página continua legível: todo o conteúdo aparece imediatamente, porque o estado inicial invisível só existe quando há biblioteca para animá-lo. Verificado com os dois domínios de CDN bloqueados.

Os cinco scripts de biblioteca carregam com verificação de integridade. O navegador recusa o arquivo se o conteúdo mudar, então um CDN comprometido não injeta código aqui. **Ao trocar a versão de qualquer biblioteca, recalcule o hash**, senão o script deixa de carregar:

```bash
curl -s <url> | openssl dgst -sha384 -binary | openssl base64 -A
```

O Google Tag Manager é a exceção, e não dá para consertar: o `gtm.js` muda toda vez que o contêiner é publicado, e não tem versão fixa para gerar hash. Ele entra sem verificação de integridade, em todas as páginas. Quem controla o contêiner `GTM-PVCC35T5` controla o que roda no site.

No blog, cada peça de JavaScript sobe isolada das outras. Navegador com dados de site bloqueados lança exceção só de encostar em `localStorage`, e antes isso derrubava tudo o que vinha depois do seletor de tema: sumário, barra de progresso, copiar, compartilhar e a faixa do canal. Agora o pior caso é perder só a peça que falhou.

## Acessibilidade e movimento

`prefers-reduced-motion` desliga tudo: rolagem suave, revelações, digitação do terminal, brilho pulsante e a onda dos botões. Alvos de toque têm ao menos 44 px. O menu do celular tranca a rolagem, fecha com Esc e sai da navegação por teclado quando está fechado.

## Desempenho

Lighthouse na URL pública: **100 no computador** nas quatro categorias. No celular, acessibilidade, boas práticas e SEO também em 100; desempenho oscila entre 72 e 82 conforme a medição, então uma execução isolada não diz nada.

O gargalo do celular não é rede. O primeiro texto do topo começa invisível e só aparece quando a biblioteca de animação carrega e roda, o que domina a métrica do maior elemento. Resolver isso significa deixar esse texto pintar sem esperar a biblioteca, o que altera a entrada animada. É decisão de design, não defeito.

## Rodar localmente

```bash
python -m http.server 8000
```

Depois abra <http://localhost:8000>. Abrir o `index.html` direto do disco também funciona, mas o vídeo do topo pode não tocar por causa das regras de origem do navegador.

## Publicar

Este repositório é servido pelo GitHub Pages. Enviar para `main` publica.

```bash
git push origin main
```

O domínio aponta para os quatro endereços do Pages, com `www` apontando para o subdomínio do GitHub. A mesma zona de DNS hospeda os registros de e-mail do domínio; **não mexa neles**, ou `contato@corvoazul.com` para de funcionar.

## Licença

Código sob MIT. As fontes são da Open Font License. As fotos e o vídeo vieram de bancos de uso livre. O nome, o glifo e a identidade visual do Corvo Azul não estão incluídos.

## Blog

`blog/` é gerado em parte. Depois de mexer em `blog/posts.json`, rode:

```bash
node blog/gerar.mjs
```

Isso reescreve as páginas de tag (`blog/tag/<tag>/`), o arquivo (`blog/arquivo/`), o `blog/feed.xml` e o `sitemap.xml`. O filtro de tag por JavaScript continua existindo para quem já está no site, mas quem indexa precisa das páginas em arquivo.

O topo dessas páginas é recortado do próprio `blog/index.html`, então mexer no cabeçalho do blog basta uma vez. O `<head>`, porém, é um modelo literal dentro do `gerar.mjs`: **tag nova no `<head>` precisa ser posta nos dois lugares**, senão as páginas de tag e o arquivo saem sem ela.

O texto dos posts é escrito à mão, sob o prompt de redação em [`blog/PROMPT-REDACAO.md`](blog/PROMPT-REDACAO.md). A única regra de lá que dá pra checar por máquina é a ausência de travessão longo no corpo do post, e o gerador avisa quando encontra um.

Os chips de tag do topo da lista são escritos à mão em `blog/index.html`, porque a lista também é. Um chip sem post correspondente leva o leitor direto para "nada encontrado", então o gerador avisa quando encontra um. O aviso não interrompe a geração.

O CTA do quiz no fim de cada post só aparece quando `blog/config.json` tiver `quiz.url` preenchido. Vazio, o bloco fica oculto.

Os prints do post são servidos em WebP, com o PNG como reserva via `<picture>`. Os dois formatos ficam no repositório; o PNG é a fonte sem perda e só é baixado por navegador que não entende WebP.
