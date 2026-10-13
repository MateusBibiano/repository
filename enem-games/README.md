# ENEM GAMES 2026: vídeo do regulamento

- `enem-games.mp4`: vídeo de 60 s (1920x1080, com trilha e efeitos sonoros).
- `enem-games.html`: player interativo (abrir no navegador): capítulos clicáveis, barra de tempo, som, tela cheia e um teste rápido de 5 perguntas que leva ao trecho certo do vídeo.

## Roteiro (8 capítulos)
| Tempo | Capítulo | Regulamento |
|---|---|---|
| 0:00 | Enem Games | Art. 1–3, 6 |
| 0:05 | Abertura: regras, sorteio, passaporte, celulares | Art. 9, 14 |
| 0:15 | Os desafios: acadêmicos (ordem livre) e esportivos (pré-requisito) | Art. 4–5 |
| 0:24 | A jornada de uma equipe + Passaporte de Certificação | Art. 10 §1º, 15 |
| 0:36 | Tempo e vagas: 10 min, 2 equipes, Opção 1 / Opção 2 | Art. 10–12 |
| 0:45 | Conduta e penalidades | Art. 3, 13, 18 |
| 0:50 | Premiação: medalha e pódio | Art. 16–17 |
| 0:55 | Pizza & picolé | encerramento |

## Como editar
Textos e tempos ficam em `src/scenes.js`; a trilha em `src/soundtrack.py`.
```
python3 src/build.py                              # gera enem-games.html
NODE_PATH=$(npm root -g) node src/render.mjs      # gera enem-games.mp4 (playwright + ffmpeg)
```
Fontes: Bungee e Barlow Condensed (SIL Open Font License).
