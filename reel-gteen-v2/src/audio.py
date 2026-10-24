"""Trilha do reel v2: música nova (piano + pads + batida leve, Si menor, 96 bpm), narração posicionada
nas cenas, efeitos de interface e ducking (a música abaixa quando a voz fala).
Uso: python3 src/audio.py build/cues.json build/voice saída.wav"""
import json
import pathlib
import sys

import numpy as np
import soundfile as sf

SR = 44100
cfg = json.loads(pathlib.Path(sys.argv[1]).read_text())
VDIR = pathlib.Path(sys.argv[2])
DUR = float(cfg["dur"])
N = int(SR * DUR)
rng = np.random.default_rng(5)
note = lambda m: 440 * 2 ** ((m - 69) / 12)


def place(buf, sig, t, g=1.0):
    i = int(t * SR)
    if i >= len(buf) or i < 0:
        return
    sig = sig[: len(buf) - i]
    buf[i : i + len(sig)] += sig * g


def env(n, a, r):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)


def piano(f, dur=1.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * k * t + k) * (0.6 ** (k - 1)) * np.exp(-t * (1.2 + k * 0.9)) for k in range(1, 6))
    return s * np.minimum(1, t / 0.004) * 0.5


def pad(freqs, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):
            ff = f * 2 ** (det / 12)
            s += sum(np.sin(2 * np.pi * ff * k * t + det * 7 + k) / k ** 1.4 for k in range(1, 5))
    a = np.minimum(1, t / 0.9) * np.minimum(1, (dur - t) / 0.9)
    # passa-baixa simples (média móvel)
    k = 18
    s = np.convolve(s, np.ones(k) / k, mode="same")
    return s * a / (len(freqs) * 6)


def kick():
    n = int(0.4 * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(48 + 90 * np.exp(-t * 28)) / SR) * np.exp(-t * 7)


def noise(dur, r):
    n = int(dur * SR)
    return rng.uniform(-1, 1, n) * env(n, 0.001, r)


def snap():
    s = noise(0.12, 0.03)
    return np.diff(s, prepend=0) * 0.8


def shaker():
    s = noise(0.05, 0.012)
    return np.diff(np.diff(s, prepend=0), prepend=0) * 0.5


# ---------- música ----------
music = np.zeros(N)
BEAT = 60 / 96
BAR = BEAT * 4
PROG = [[47, 50, 54], [43, 47, 50], [50, 54, 57], [45, 49, 52]]  # Bm G D A
vat = {v["id"]: v["t"] for v in cfg["voice_at"]}
t_beat_in = vat.get("equipe", 12) - 0.6
t_drop = vat.get("compara", 50) - 0.4
t_out = DUR - 4.0
nbars = int(DUR / BAR) + 1
for b in range(nbars):
    t0 = b * BAR
    ch = PROG[b % 4]
    if t0 > DUR - 1:
        break
    place(music, pad([note(m + 12) for m in ch], BAR + 0.9), t0, 0.55)
    place(music, np.sin(2 * np.pi * note(ch[0] - 12) * np.arange(int(BAR * SR)) / SR) * env(int(BAR * SR), 0.02, 1.4), t0, 0.32 if t0 >= t_beat_in else 0.14)
    # arpejo de piano em colcheias
    arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24, ch[2] + 12, ch[1] + 24, ch[0] + 24, ch[2] + 12]
    for k, m in enumerate(arp):
        tt = t0 + k * BEAT / 2
        g = 0.16 if (k % 2 == 0) else 0.1
        if t0 < t_beat_in and k % 2:
            continue
        place(music, piano(note(m)), tt, g)
    if t_beat_in <= t0 < t_out:
        for k in range(4):
            tt = t0 + k * BEAT
            if k in (0, 2):
                place(music, kick(), tt, 0.55 if t0 >= t_drop else 0.4)
            if k in (1, 3):
                place(music, snap(), tt, 0.22)
            for h in range(4 if t0 >= t_drop else 2):
                place(music, shaker(), tt + h * BEAT / (4 if t0 >= t_drop else 2), 0.12)
# acorde final
place(music, pad([note(m + 12) for m in [47, 50, 54, 59]], 4.5), t_out, 0.7)
place(music, piano(note(71), 4), t_out, 0.25)
place(music, piano(note(66), 4), t_out + 0.1, 0.2)

# ---------- voz ----------
voice = np.zeros(N)
for v in cfg["voice_at"]:
    a, sr = sf.read(VDIR / f"{v['id']}.wav")
    if sr != SR:
        idx = np.arange(0, len(a), sr / SR)
        a = np.interp(idx, np.arange(len(a)), a)
    place(voice, a, v["t"], 1.0)
voice /= np.max(np.abs(voice)) + 1e-9
voice *= 0.9

# ---------- efeitos ----------
fx = np.zeros(N)
for c in cfg["cues"]:
    t, k = c["t"], c["k"]
    if k == "swish":
        n = int(0.4 * SR)
        s = rng.uniform(-1, 1, n)
        y = np.zeros(n)
        acc = 0.0
        for i in range(n):
            kk = 0.03 + 0.4 * (i / n)
            acc += kk * (s[i] - acc)
            y[i] = acc
        place(fx, y * np.sin(np.pi * np.arange(n) / n) ** 2, t, 0.35)
    elif k == "blip":
        place(fx, np.sin(2 * np.pi * 1320 * np.arange(int(0.12 * SR)) / SR) * env(int(0.12 * SR), 0.002, 0.04), t, 0.18)
        place(fx, np.sin(2 * np.pi * 1980 * np.arange(int(0.1 * SR)) / SR) * env(int(0.1 * SR), 0.002, 0.03), t + 0.06, 0.12)
    elif k == "shimmer":
        for i, m in enumerate([83, 86, 90, 95, 98]):
            place(fx, piano(note(m), 1.2), t + i * 0.06, 0.12)
    elif k == "chime2":
        place(fx, piano(note(86), 1.5), t, 0.3)
        place(fx, piano(note(93), 1.8), t + 0.12, 0.3)

# ---------- ducking ----------
e = np.abs(voice)
win = int(0.03 * SR)
e = np.convolve(e, np.ones(win) / win, mode="same")
# segura a envolvente (release lento)
hold = np.zeros_like(e)
r = np.exp(-1 / (0.35 * SR))
acc = 0.0
step = 64
for i in range(0, N, step):
    acc = max(e[i], acc * r ** step)
    hold[i : i + step] = acc
hold /= hold.max() + 1e-9
duck = 1 - 0.62 * np.clip(hold * 2.2, 0, 1)

mix = music * 0.42 * duck + voice * 1.0 + fx * 0.8
fade = np.ones(N)
fn = int(1.5 * SR)
fade[-fn:] = np.linspace(1, 0, fn)
fade[: int(0.05 * SR)] = np.linspace(0, 1, int(0.05 * SR))
mix *= fade
mix = np.tanh(mix * 1.1)
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.92
sf.write(sys.argv[3], np.stack([mix, mix], axis=1), SR, subtype="PCM_16")
print("ok", sys.argv[3], round(DUR, 1), "s")
