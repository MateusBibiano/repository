"""Monta enem-games.html (autocontido: fontes, animação e trilha embutidas)."""
import base64
import pathlib
import subprocess

SRC = pathlib.Path(__file__).resolve().parent
ROOT = SRC.parent
BUILD = ROOT / "build"
BUILD.mkdir(exist_ok=True)

wav = BUILD / "trilha.wav"
mp3 = BUILD / "trilha.mp3"
cues = BUILD / "cues.json"
js = "global.window={};require(process.argv[1]);const G=window.EnemGames;console.log(JSON.stringify({dur:G.DUR,cues:G.CUES}))"
cues.write_text(subprocess.run(["node", "-e", js, str(SRC / "scenes.js")], check=True, capture_output=True, text=True).stdout)
subprocess.run(["python3", str(SRC / "soundtrack.py"), str(cues), str(wav)], check=True)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-b:a", "96k", str(mp3)], check=True)

faces = [
    ("Bungee", 400, "Bungee-Regular.ttf"),
    ("Barlow Condensed", 500, "BarlowCondensed-Medium.ttf"),
    ("Barlow Condensed", 600, "BarlowCondensed-SemiBold.ttf"),
    ("Barlow Condensed", 700, "BarlowCondensed-SemiBold.ttf"),
    ("Barlow Condensed", 800, "BarlowCondensed-ExtraBold.ttf"),
]
css = "\n".join(
    f'@font-face{{font-family:"{fam}";font-weight:{w};font-display:block;'
    f"src:url(data:font/ttf;base64,{base64.b64encode((SRC / 'fonts' / f).read_bytes()).decode()}) format(\"truetype\")}}"
    for fam, w, f in faces
)
html = (SRC / "player.html").read_text()
html = html.replace("/*@FONTS*/", css)
html = html.replace("/*@SCENES*/", (SRC / "scenes.js").read_text())
html = html.replace("@AUDIO_SRC@", "data:audio/mpeg;base64," + base64.b64encode(mp3.read_bytes()).decode(), 1)
(ROOT / "enem-games.html").write_text(html)
print("ok", ROOT / "enem-games.html", len(html) // 1024, "KB")
