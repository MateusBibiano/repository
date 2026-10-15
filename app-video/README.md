# Vídeo: como usar o app ENEM Games

`app-enem-games.mp4`: vídeo explicativo (≈3:20, 1920x1080, com trilha) feito com as **telas reais do app**,
exibidas num celular e num notebook 3D.

## Roteiro
| Cena | Conteúdo |
|---|---|
| Abertura | logo do app |
| O app | um link, três abas: Painel, Meu posto, Organização; indicador "Ao vivo" |
| Painel | validações e equipes em andamento, "Agora nas salas", 13 quadrados por equipe, espera, legenda |
| Meu posto 1–2 | escolher o posto, senha do posto |
| A fila | situação de cada equipe no posto |
| Passo 3 | Iniciar tempo; cronômetro fica laranja aos 8 min e vermelho após 10 |
| Passo 4 | Concluiu; desfazer validação com dois toques |
| Ao vivo | a validação aparece no painel na hora |
| Não concluiu | dois toques, espera de 10 min contada pelo app, nova tentativa |
| Cancelar / outra sala | cancelar tempo; o app impede duas salas ao mesmo tempo |
| Esportivos | liberação só com a área completa; o que falta |
| Organização | senha, ranking e critérios, acessar postos, equipes, postos e senhas, zerar evento |
| Dicas | dois toques, internet, senhas |

## Como foi feito
1. `capture/capture.mjs` abre o `index.html` do app no Chromium com um **Firestore falso** (`capture/fake-firebase.js`)
   e dados de demonstração (`capture/seed.mjs`, senhas fictícias), controla o relógio e grava cada tela.
   Nada é gravado no banco real.
2. `src/video.js` monta o vídeo em Three.js (r128): estúdio 3D, aparelhos, câmera, destaques, toques e legendas.
3. `src/render.mjs` renderiza os quadros e junta com a trilha (`src/soundtrack.py`).

```
NODE_PATH=$(npm root -g) node capture/capture.mjs /caminho/do/app/index.html build/shots
python3 src/build.py
NODE_PATH=$(npm root -g) node src/render.mjs --workers 3
```
O arquivo do app não fica neste repositório (ele contém a configuração do Firebase e as senhas padrão).
