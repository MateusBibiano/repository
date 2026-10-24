"""Gera a trilha (música + efeitos) a partir das cues de scenes.js.
Uso: soundtrack.py cues.json saida.wav"""
import json
import sys
import wave

import numpy as np

SR = 44100
CFG = json.load(open(sys.argv[1]))
DUR = float(CFG['dur'])
N = int(SR * DUR)
out = np.zeros(N)
rng = np.random.default_rng(3)


def add(sig, t, gain=1.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    out[i : i + len(sig)] += sig * gain


def env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR
    e = np.minimum(1, t / a) * np.exp(-t / r)
    return e


def tone(freq, dur, kind="sine", a=0.005, r=0.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = 2 * np.pi * freq * t
    if kind == "sine":
        w = np.sin(ph)
    elif kind == "tri":
        w = 2 / np.pi * np.arcsin(np.sin(ph))
    else:  # square suave
        w = np.tanh(3 * np.sin(ph))
    return w * env(n, a, r)


def kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 50 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def noise(dur, r):
    n = int(dur * SR)
    return rng.uniform(-1, 1, n) * env(n, 0.001, r)


def hat():
    s = noise(0.06, 0.015)
    return np.diff(s, prepend=0)


def clap():
    return noise(0.2, 0.05) * 0.8


def whoosh(dur=0.45):
    n = int(dur * SR)
    s = rng.uniform(-1, 1, n)
    # passa-baixa simples com corte subindo
    y = np.zeros(n)
    acc = 0.0
    for i in range(n):
        k = 0.02 + 0.3 * (i / n)
        acc += k * (s[i] - acc)
        y[i] = acc
    t = np.arange(n) / SR
    return y * np.sin(np.pi * t / dur) ** 2 * 2.5


def note(m):
    return 440 * 2 ** ((m - 69) / 12)


# ----- música: 120 bpm; progressões alternam a cada 16 compassos -----
BEAT = 0.5
PROGS = [
    [[48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48]],  # C G Am F
    [[45, 48, 52], [41, 45, 48], [48, 52, 55], [43, 47, 50]],  # Am F C G
]
nbeats = int(DUR / BEAT)
for b in range(nbeats):
    t = b * BEAT
    bar = b // 4
    ch = PROGS[(bar // 16) % 2][bar % 4]
    intro = t < 4.5
    if t >= DUR - 2:
        continue
    if not intro:
        add(kick(), t, 0.45)
        if b % 2 == 1:
            add(clap(), t, 0.12)
    for h in (0, 0.25):
        add(hat(), t + h, 0.08 if not intro else 0.04)
        add(tone(note(ch[0]), 0.22, "tri", 0.003, 0.12), t + h, 0.2 if not intro else 0.1)
    if (bar // 8) % 2 == 0 or t > DUR - 30:
        for j in range(4):
            m = ch[(b * 4 + j) % 3] + 24
            add(tone(note(m), 0.14, "square", 0.002, 0.05), t + j * 0.125, 0.04)
    else:
        if b % 4 == 0:
            for m in ch:
                add(tone(note(m + 12), 1.9, "tri", 0.05, 0.9), t, 0.05)

# ----- efeitos (cues) -----
def fx(k, t, d=None):
    if k == "whoosh":
        add(whoosh(), t, 0.3)
    elif k in ("hit", "seal"):
        add(kick(), t, 0.5)
        add(noise(0.08, 0.02), t, 0.2)
    elif k == "step":
        add(tone(note(79), 0.18, "sine", 0.002, 0.08), t, 0.25)
        add(tone(note(84), 0.25, "sine", 0.002, 0.12), t + 0.08, 0.2)
    elif k == "horn":
        for i, m in enumerate((67, 72, 76, 79)):
            add(tone(note(m), 0.35, "square", 0.004, 0.2), t + i * 0.07, 0.13)
    elif k == "shuffle":
        add(whoosh(1.6), t, 0.3)
    elif k == "chime":
        for i in range(5):
            add(tone(note(72 + i * 3), 0.12, "tri", 0.002, 0.07), t + i * 0.07, 0.18)
    elif k == "tick":
        add(tone(note(84), 0.1, "sine", 0.002, 0.04), t, 0.2)
    elif k == "validate":
        add(kick(), t, 0.3)
        add(tone(note(79), 0.12, "sine", 0.002, 0.06), t, 0.22)
        add(tone(note(88), 0.18, "sine", 0.002, 0.09), t + 0.07, 0.18)
    elif k == "unlock":
        add(tone(note(76), 0.12, "tri", 0.002, 0.06), t, 0.22)
        add(tone(note(83), 0.25, "tri", 0.002, 0.12), t + 0.09, 0.22)
    elif k == "card":
        add(noise(0.05, 0.015), t, 0.25)
        add(tone(note(67), 0.12, "tri", 0.002, 0.06), t, 0.2)
    elif k == "countdown":
        x = t
        while x < t + d:
            add(hat(), x, 0.3)
            add(tone(2000, 0.02, "sine", 0.001, 0.01), x, 0.1)
            x += 0.12
    elif k == "buzzer":
        add(tone(note(43), 0.7, "square", 0.004, 0.4), t, 0.3)
        add(tone(note(44), 0.7, "square", 0.004, 0.4), t, 0.2)
    elif k == "buzzer-soft":
        add(tone(note(48), 0.3, "square", 0.004, 0.15), t, 0.15)
    elif k == "down":
        add(tone(note(64), 0.12, "tri", 0.002, 0.08), t, 0.18)
    elif k == "fanfare":
        for i, m in enumerate((72, 76, 79, 84)):
            add(tone(note(m), 0.5, "square", 0.004, 0.3), t + i * 0.12, 0.11)
    elif k == "pop":
        add(tone(note(60), 0.3, "sine", 0.002, 0.1), t, 0.3)
    elif k == "sparkle":
        for i in range(6):
            add(tone(note(96 + (i % 3) * 3), 0.1, "sine", 0.001, 0.05), t + i * 0.05, 0.12)
    elif k == "tap":
        add(noise(0.03, 0.006), t, 0.35)
        add(tone(1800, 0.03, "sine", 0.001, 0.01), t, 0.18)
    elif k == "ping":
        add(tone(note(88), 0.25, "sine", 0.002, 0.12), t, 0.22)
    elif k == "buzz":
        add(tone(note(46), 0.35, "square", 0.004, 0.18), t, 0.18)
    elif k == "clockrun":
        x = t
        while x < t + d:
            add(hat(), x, 0.22)
            x += 0.18
    elif k == "riser":
        n = int(0.85 * SR)
        tt = np.arange(n) / SR
        sweep = np.sin(2 * np.pi * np.cumsum(200 + 1400 * (tt / 0.85) ** 2) / SR)
        add((sweep * 0.3 + rng.uniform(-1, 1, n) * 0.5) * (tt / 0.85) ** 2, t, 0.22)
    elif k == "boom":
        n = int(1.2 * SR)
        tt = np.arange(n) / SR
        f = 38 + 60 * np.exp(-tt * 8)
        add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 3.2), t, 0.75)
        add(noise(0.3, 0.08), t, 0.25)
        for m in (60, 67, 72):
            add(tone(note(m), 1.0, "square", 0.004, 0.45), t, 0.07)
    elif k == "finale":
        for i, m in enumerate((72, 76, 79, 84, 88)):
            add(tone(note(m), 0.6, "square", 0.004, 0.35), t + i * 0.06, 0.1)
        for m in (48, 60, 64, 67, 72):
            add(tone(note(m), 3.0, "tri", 0.01, 1.2), t + 0.4, 0.12)


for c in CFG["cues"]:
    fx(c["k"], max(0.0, c["t"]), c.get("d"))

# fade final e normalização
fade = np.ones(N)
fn = int(0.8 * SR)
fade[-fn:] = np.linspace(1, 0, fn)
out *= fade
out = np.tanh(out * 1.2)
out /= np.max(np.abs(out)) + 1e-9
out *= 0.85
pcm = (out * 32767).astype(np.int16)

with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("ok", sys.argv[2])
