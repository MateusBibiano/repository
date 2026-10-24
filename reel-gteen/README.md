# Reel: Mérito Científico GTEeN · Voz Visível

`reel-voz-visivel.mp4`: vídeo vertical para Instagram Reels (1080x1920, 30 fps, ~88 s, com trilha),
no mesmo estilo 3D dos vídeos do ENEM Games, com a identidade azul da equipe GTEeN.

## Roteiro
| Cena | Conteúdo |
|---|---|
| Gancho | "E se um aluno pudesse pedir ajuda sem dizer uma palavra?" |
| Apresentação | logo GTEeN, Voz Visível, Mérito Científico TBR 2026 |
| Problema | alunos com deficiência sem como avisar o professor; frustração, atraso, isolamento |
| Solução | webcam comum + MediaPipe; sinais combinados com cada aluno; sem telas extras nem vestíveis |
| Como funciona 1–3 | Face Landmarker (rosto), Hand Landmarker (21 pontos por mão), Pose Landmarker (postura) |
| Como decide | coordenadas (x, y, z) comparadas ao perfil calibrado; pedido reconhecido |
| Alerta | aviso discreto só no computador do professor (interface real do protótipo) |
| Privacidade | sinais autorizados, processamento local, sem guardar imagens |
| Custo | R$ 50 (webcam); computador da escola; software gratuito |
| Método | pesquisa aplicada quali-quantitativa; métricas; testes internos feitos; próxima etapa: validação com aluno; ODS 4 |
| Equipe | foto, Curso G9, Itajubá/MG, técnico e mentor |
| Final | Voz Visível · TBR 2026 |

## Como gerar
As imagens (logo, foto da equipe, interface e logo do TBR) são extraídas do .docx do trabalho e ficam fora do git.
```
python3 -I src/assets.py /caminho/GTEeN_MeritoCientifico2026_GTEeN.docx
python3 src/build.py
NODE_PATH=$(npm root -g) node src/render.mjs --workers 3
```
Textos e tempos: `src/reel.js` (lista `SCENES` e objeto `OVER`).
