"""Extrai do .docx do Mérito Científico as imagens usadas no reel (vão para build/assets, fora do git).
Uso: python3 -I src/assets.py /caminho/do/arquivo.docx"""
import io
import pathlib
import sys
import zipfile

from PIL import Image, ImageDraw

OUT = pathlib.Path(__file__).resolve().parent.parent / "build" / "assets"
OUT.mkdir(parents=True, exist_ok=True)
z = zipfile.ZipFile(sys.argv[1])
img = {n.split("/")[-1]: Image.open(io.BytesIO(z.read(n))) for n in z.namelist() if n.startswith("word/media/")}
cover = img["image3.png"].convert("RGBA")
# logo da equipe (círculo no topo da capa)
logo = cover.crop((112, 82, 378, 348)).resize((512, 512), Image.LANCZOS)
mask = Image.new("L", logo.size, 0)
ImageDraw.Draw(mask).ellipse((4, 4, 508, 508), fill=255)
logo.putalpha(mask)
logo.save(OUT / "logo.png")
# foto da equipe
cover.crop((100, 430, 1300, 1075)).convert("RGB").save(OUT / "equipe.jpg", quality=92)
# interface do protótipo e logo do TBR
img["image1.png"].convert("RGB").save(OUT / "interface.png")
img["image2.png"].convert("RGBA").save(OUT / "tbr.png")
print("ok", sorted(p.name for p in OUT.iterdir()))
