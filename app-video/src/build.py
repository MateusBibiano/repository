"""Prepara build/: copia o compositor, gera manifest.js a partir das capturas, cues e trilha."""
import json
import pathlib
import shutil
import subprocess

SRC = pathlib.Path(__file__).resolve().parent
ROOT = SRC.parent
BUILD = ROOT / "build"
man = json.loads((BUILD / "shots" / "manifest.json").read_text())
(BUILD / "manifest.js").write_text("window.MANIFEST = " + json.dumps(man) + ";\n")
shutil.copy(SRC / "video.html", BUILD / "video.html")
vendor = BUILD / "vendor"
if not (vendor / "three").exists():
    vendor.mkdir(exist_ok=True)
    tgz = subprocess.run(["npm", "pack", "three@0.128.0", "--silent"], cwd=vendor, check=True, capture_output=True, text=True).stdout.strip().splitlines()[-1]
    (vendor / "three").mkdir(exist_ok=True)
    subprocess.run(["tar", "xzf", tgz, "-C", "three", "--strip-components=1"], cwd=vendor, check=True)
print("ok build")
