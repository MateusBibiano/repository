"""Gera a narração (Kokoro, voz pt-BR) fala por fala. Uso: python3 src/voice.py <pasta-do-modelo> [voz]
Saída: build/voice/<id>.wav e build/voice/voice.json (duração de cada fala)."""
import json
import pathlib
import sys

import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "build" / "voice"
OUT.mkdir(parents=True, exist_ok=True)
model = pathlib.Path(sys.argv[1])
voice = sys.argv[2] if len(sys.argv) > 2 else "pf_dora"
k = Kokoro(str(model / "kokoro-v1.0.onnx"), str(model / "voices-v1.0.bin"))
lines = json.loads((ROOT / "src" / "narration.json").read_text())
meta = []
for ln in lines:
    audio, sr = k.create(ln["say"], voice=voice, speed=1.02, lang="pt-br")
    sf.write(OUT / f"{ln['id']}.wav", audio, sr)
    meta.append({"id": ln["id"], "text": ln["text"], "dur": round(len(audio) / sr, 3), "sr": sr})
    print(ln["id"], meta[-1]["dur"])
(OUT / "voice.json").write_text(json.dumps({"voice": voice, "lines": meta}, ensure_ascii=False, indent=1))
