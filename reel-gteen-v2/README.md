# Reel narrado: Voz Visível (GTEeN)

`reel-voz-visivel-narrado.mp4`: reel vertical (1080x1920, ~1:38) com **narração**, música nova, efeitos e
legendas sincronizadas palavra por palavra.

## O que tem no vídeo
- Sala de aula 3D com aluno, colegas e professor animados (boneco Xbot do three.js, com esqueleto).
- Landmarks do MediaPipe presos aos ossos: corpo (Pose) e os **21 pontos da mão** (Hand) seguindo os dedos.
- **Malha canônica do rosto do MediaPipe** (468 pontos) no aluno e em holograma grande, com expressões
  (sobrancelhas, sorriso) para mostrar como o sinal facial é lido.
- Comunicação: o sinal sai do aluno, chega ao notebook do professor (interface real do protótipo, card
  "Pedido / Gesto" aceso) e o professor vai até o aluno.
- Cena "inclusão sem padrão": um menino e uma menina, cada um com o próprio sinal calibrado, a mesma chance de ser ouvido.

## Como gerar
1. Voz (Kokoro, pt-BR): baixe `kokoro-v1.0.onnx` e `voices-v1.0.bin` (releases de thewh1teagle/kokoro-onnx), `pip install kokoro-onnx soundfile`
   e rode `python3 src/voice.py <pasta-do-modelo> pf_dora` (vozes: pf_dora, pm_alex, pm_santa). O texto está em `src/narration.json`.
2. Assets em `build/assets/`: `Xbot.glb` (three.js r128), `canonical_face_model.obj` (MediaPipe) e as imagens do reel v1
   (`python3 -I ../reel-gteen/src/assets.py <docx>` e copiar).
3. `python3 src/build.py` e `NODE_PATH=$(npm root -g) node src/render.mjs --workers 3`.
A trilha (música, voz, efeitos e ducking) é montada por `src/audio.py`.
