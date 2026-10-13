# ENEM GAMES 2026: vídeo do regulamento

- `enem-games.mp4`: vídeo de 2:54 (1920x1080, com trilha e efeitos sonoros).
- `enem-games.html`: player interativo (abrir no navegador): capítulos clicáveis, barra de tempo, som, tela cheia e um teste rápido de 8 perguntas que leva ao trecho certo do vídeo.

## Roteiro
| Tempo | Capítulo | Conteúdo |
|---|---|---|
| 0:00 | Abertura | 18h início → explicação → sorteio → preparação → 18h30 largada |
| 0:20 | Equipes e celulares | trios sorteados, sempre juntos; celulares no envelope |
| 0:36 | Passaporte digital | app controlado pela Organização (Carol, Renato, Bibi) |
| 0:49 | Áreas e salas | 4 áreas, 9 salas, com local e professor de cada sala |
| 1:27 | Esportivos | Ed. Física (Valência, Alex, Matheus Maciel); liberam ao concluir todas as salas da área |
| 1:38 | Regras das salas | 10 min, 2 equipes por sala, Opção 1 / Opção 2, conduta e penalidades |
| 2:06 | A noite | exemplo de itinerário de 18h30 a 21h, validado no app |
| 2:23 | Premiação e pizza | premiação na sala do PV; depois, pizza |
| 2:39 | Sobremesa e fim | 22h picolé; 22h30 encerramento e créditos |

## Como editar
Salas, textos e tempos ficam em `src/scenes.js` (lista `ROOMS` e roteiro `SCENES`); a trilha em `src/soundtrack.py` segue as cues de cada cena.
```
python3 src/build.py                              # gera enem-games.html
NODE_PATH=$(npm root -g) node src/render.mjs      # gera enem-games.mp4 (playwright + ffmpeg)
```
Fontes: Bungee e Barlow Condensed (SIL Open Font License).
