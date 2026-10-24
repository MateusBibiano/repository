"""Prepara build/: página do reel e Three.js local (as imagens vêm de src/assets.py)."""
import pathlib
import shutil
import subprocess

SRC = pathlib.Path(__file__).resolve().parent
BUILD = SRC.parent / "build"
BUILD.mkdir(exist_ok=True)
shutil.copy(SRC / "reel.html", BUILD / "reel.html")
vendor = BUILD / "vendor"
if not (vendor / "three").exists():
    vendor.mkdir(exist_ok=True)
    tgz = subprocess.run(["npm", "pack", "three@0.128.0", "--silent"], cwd=vendor, check=True, capture_output=True, text=True).stdout.strip().splitlines()[-1]
    (vendor / "three").mkdir(exist_ok=True)
    subprocess.run(["tar", "xzf", tgz, "-C", "three", "--strip-components=1"], cwd=vendor, check=True)
print("ok build")
