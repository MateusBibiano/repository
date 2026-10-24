"""Prepara build/: página, dados da narração (voice.js) e Three.js local.
Antes: python3 src/voice.py <modelo-kokoro>  e os assets em build/assets (ver README)."""
import json
import pathlib
import shutil
import subprocess

SRC = pathlib.Path(__file__).resolve().parent
BUILD = SRC.parent / "build"
shutil.copy(SRC / "reel2.html", BUILD / "reel2.html")
v = json.loads((BUILD / "voice" / "voice.json").read_text())
(BUILD / "voice.js").write_text("window.VOICE = " + json.dumps(v, ensure_ascii=False) + ";\n")
vendor = BUILD / "vendor"
if not (vendor / "three").exists():
    vendor.mkdir(exist_ok=True)
    tgz = subprocess.run(["npm", "pack", "three@0.128.0", "--silent"], cwd=vendor, check=True, capture_output=True, text=True).stdout.strip().splitlines()[-1]
    (vendor / "three").mkdir(exist_ok=True)
    subprocess.run(["tar", "xzf", tgz, "-C", "three", "--strip-components=1"], cwd=vendor, check=True)
print("ok build")
