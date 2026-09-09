#!/usr/bin/env python3
"""Escreve assets/fonts/glifos.json com os code points que cada .woff2 REALMENTE contem.

Por que existe: o guarda do blog/gerar.mjs comparava o texto do site com a faixa
unicode-range DECLARADA no CSS. Um recorte que derrubasse um glifo sem estreitar a
faixa passava em silencio — foi assim que ©, › e ↑ sumiram em 09/09 e chegaram a ser
commitados. Ler woff2 em Node exigiria destransformar o formato; ler em Python com
fontTools custa dez linhas. Entao o recorte publica o que fez, e o guarda confere.

Rode SEMPRE depois de mexer nas fontes:
    python3 assets/fonts/gerar-manifesto.py

O manifesto guarda o tamanho de cada arquivo. Se o .woff2 mudar sem o manifesto ser
regerado, o guarda acusa em vez de confiar num dado velho.
"""
import json, os, sys
from fontTools.ttLib import TTFont

AQUI = os.path.dirname(os.path.abspath(__file__))
saida = os.path.join(AQUI, 'glifos.json')

fontes = sorted(f for f in os.listdir(AQUI) if f.endswith('.woff2'))
if not fontes:
    sys.exit('nenhum .woff2 em assets/fonts')

manifesto = {'_leiame': 'gerado por gerar-manifesto.py; nao editar a mao', 'fontes': {}}
for nome in fontes:
    caminho = os.path.join(AQUI, nome)
    cm = TTFont(caminho).getBestCmap()
    manifesto['fontes'][nome] = {
        'bytes': os.path.getsize(caminho),
        'glifos': len(cm),
        'codepoints': sorted(cm.keys()),
    }
    print(f'  {nome:34s} {len(cm):4d} glifos, {os.path.getsize(caminho):6d} B')

with open(saida, 'w', encoding='utf-8') as f:
    json.dump(manifesto, f, separators=(',', ':'))
print(f'  -> {os.path.relpath(saida, os.path.dirname(AQUI))} ({os.path.getsize(saida)} B)')
