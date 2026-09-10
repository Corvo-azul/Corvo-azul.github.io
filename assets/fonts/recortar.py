#!/usr/bin/env python3
"""Recorta as quatro fontes do site a partir dos pacotes fontsource (npm).

Origem: os .ttf originais nunca estiveram no repositorio, e recortar um .woff2
ja recortado nao devolve glifo que ele nao tem -- foi assim que o `~` ficou
fora por dias. Os pacotes fontsource sao gerados dos mesmos arquivos do Google
Fonts (mesma versao no `head.fontRevision`, mesmo UPM, mesmos eixos), e cobrem
o latin inteiro (U+0000-00FF), que basta para o site.

Uso, a partir de site-deploy/:
    cd /tmp && npm pack @fontsource-variable/bricolage-grotesque@5.3.0 \
        @fontsource-variable/archivo@5.3.0 @fontsource/ibm-plex-mono@5.3.0
    (extraia os .tgz)  ->  python3 assets/fonts/recortar.py /tmp/<pasta-com-os-tgz-extraidos>
    python3 assets/fonts/gerar-manifesto.py
    node blog/gerar.mjs        # a guarda de glifos tem que ficar calada

Os code points vem do glifos.json atual mais o que for passado em --mais
(ex.: --mais 007E). Opcoes do recorte iguais as do lote original -- provado
pixel a pixel em 10/09 nas quatro paginas: kern/liga/locl mantidos, sem
instanciar eixo (Bricolage precisa de opsz+wght, o arquivo e o *-opsz-normal).
"""
import json, sys, os, argparse
# head.modified fixo: sem isto cada rodada muda bytes do arquivo sem mudar um pixel,
# e o git veria diff onde nao ha diferenca.
os.environ.setdefault('SOURCE_DATE_EPOCH', '0')
from fontTools.ttLib import TTFont
from fontTools import subset

AQUI = os.path.dirname(os.path.abspath(__file__))
ORIGENS = {
    'archivo-latin.woff2': 'fontsource-variable-archivo-5.3.0/package/files/archivo-latin-wght-normal.woff2',
    'bricolage-grotesque-latin.woff2': 'fontsource-variable-bricolage-grotesque-5.3.0/package/files/bricolage-grotesque-latin-opsz-normal.woff2',
    'ibm-plex-mono-400-latin.woff2': 'fontsource-ibm-plex-mono-5.3.0/package/files/ibm-plex-mono-latin-400-normal.woff2',
    'ibm-plex-mono-500-latin.woff2': 'fontsource-ibm-plex-mono-5.3.0/package/files/ibm-plex-mono-latin-500-normal.woff2',
}

ap = argparse.ArgumentParser()
ap.add_argument('raiz', help='pasta onde os .tgz do fontsource foram extraidos')
ap.add_argument('--mais', nargs='*', default=[], help='code points extras em hex, ex.: 007E 2191')
args = ap.parse_args()

manifesto = json.load(open(os.path.join(AQUI, 'glifos.json'), encoding='utf-8'))
extras = {int(h, 16) for h in args.mais}

for nome, rel in ORIGENS.items():
    origem = os.path.join(args.raiz, rel)
    if not os.path.exists(origem):
        sys.exit(f'nao achei {origem}')
    cps = set(manifesto['fontes'][nome]['codepoints']) | extras
    f = TTFont(origem)
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.glyph_names = False
    opts.name_IDs = ['*']
    opts.layout_features = ['kern', 'liga', 'locl']
    s = subset.Subsetter(opts)
    s.populate(unicodes=cps)
    s.subset(f)
    f.flavor = 'woff2'
    destino = os.path.join(AQUI, nome)
    f.save(destino)
    t = TTFont(destino)
    print(f'{nome:36} {len(t.getBestCmap()):4} glifos, {os.path.getsize(destino):6} B, eixos: '
          f"{[a.axisTag for a in t['fvar'].axes] if 'fvar' in t else '-'}")

print('agora: python3 assets/fonts/gerar-manifesto.py && node blog/gerar.mjs')
