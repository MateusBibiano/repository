# ENEM GAMES 2026: vídeo do regulamento

- `enem-games.mp4`: vídeo de 3:11 em 3D (1920x1080, com trilha e efeitos sonoros).
- `enem-games.html`: player interativo, com o mesmo palco 3D em tempo real (WebGL; sem WebGL, cai para a versão 2D) (abrir no navegador): capítulos clicáveis, barra de tempo, som, tela cheia e um teste rápido de 8 perguntas que leva ao trecho certo do vídeo.

## Visual 3D
As cenas 2D viram telões numa arena 3D (piso neon, arcos de luz, holofotes, partículas e formas flutuantes). Entre as cenas há transições de câmera (cubo, slide, flip, porta e voo), e cada capítulo abre com uma vinheta de número 3D. Logo, medalha, pizza, picolés e confete são objetos 3D. Motor em `src/stage3d.js` (Three.js r128).

## Roteiro (tempos aproximados)
| Tempo | Capítulo | Conteúdo |
|---|---|---|
| 0:00 | Abertura | 18h início → explicação → sorteio → preparação → 18h30 largada |
| 0:20 | Equipes e celulares | trios sorteados, sempre juntos; celulares no envelope |
| 0:38 | Passaporte digital | app controlado pela Organização (Carol, Renato, Bibi) |
| 0:53 | Áreas e salas | 4 áreas, 9 salas, com local e professor de cada sala |
| 1:33 | Esportivos | Ed. Física (Valência, Alex, Matheus Maciel); liberam ao concluir todas as salas da área |
| 1:46 | Regras das salas | 10 min, 2 equipes por sala, Opção 1 / Opção 2, conduta e penalidades |
| 2:16 | A noite | exemplo de itinerário de 18h30 a 21h, validado no app |
| 2:35 | Premiação e pizza | premiação na sala do PV; depois, pizza |
| 2:53 | Sobremesa e fim | 22h picolé; 22h30 encerramento e créditos |

## Como editar
Salas, textos e tempos ficam em `src/scenes.js` (lista `ROOMS` e roteiro `SCENES`); a trilha em `src/soundtrack.py` segue as cues de cada cena.
```
python3 src/build.py                              # gera enem-games.html
NODE_PATH=$(npm root -g) node src/render.mjs --workers 3   # gera enem-games.mp4 (playwright + ffmpeg, ~40 min)
```
Fontes: Bungee e Barlow Condensed (SIL Open Font License).
