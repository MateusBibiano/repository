"""Gera a trilha (música + efeitos) sincronizada com scenes.js. Saída: WAV mono 44.1 kHz."""
import sys
import wave

import numpy as np

SR = 44100
DUR = 60.0
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


# ----- música: 120 bpm, C – G – Am – F -----
BEAT = 0.5
CHORDS = [[48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48]]
nbeats = int(DUR / BEAT)
for b in range(nbeats):
    t = b * BEAT
    bar = b // 4
    ch = CHORDS[bar % 4]
    intro = t < 4.5
    ending = t >= 59
    if ending:
        continue
    if not intro:
        add(kick(), t, 0.55)
        if b % 2 == 1:
            add(clap(), t, 0.16)
    for h in (0, 0.25):
        add(hat(), t + h, 0.10 if not intro else 0.05)
    # baixo em colcheias
    for h in (0, 0.25):
        add(tone(note(ch[0] - 12 + 12), 0.22, "tri", 0.003, 0.12), t + h, 0.22 if not intro else 0.12)
    # arpejo
    for j in range(4):
        m = ch[(b * 4 + j) % 3] + 24
        add(tone(note(m), 0.14, "square", 0.002, 0.05), t + j * 0.125, 0.05)

# ----- efeitos -----
for tt in (5, 15, 24, 36, 45, 50, 55):
    add(whoosh(), tt - 0.3, 0.35)
# checks da explicação das regras
for i in range(3):
    add(tone(note(84), 0.12, "sine", 0.002, 0.05), 5 + 0.6 + i * 0.45 + 0.4, 0.25)
# sorteio
add(whoosh(1.0), 5 + 2.7, 0.3)
for i in range(6):
    add(tone(note(72 + i * 2), 0.1, "tri", 0.002, 0.06), 5 + 5.0 + i * 0.08, 0.2)
# envelope selado
add(kick(), 5 + 9.45, 0.5)
add(tone(note(60), 0.25, "square", 0.002, 0.08), 5 + 9.45, 0.15)
# largada às 18h
for i, m in enumerate((67, 72, 76, 79)):
    add(tone(note(m), 0.35, "square", 0.004, 0.2), 15 + i * 0.07, 0.14)
# desbloqueios
for k in range(4):
    td = 15 + 3.0 + k * 1.15
    add(tone(note(79), 0.12, "sine", 0.002, 0.06), td, 0.25)
    add(tone(note(86), 0.2, "sine", 0.002, 0.1), td + 0.5, 0.2)
# carimbos da jornada
for i in range(8):
    td = 24 + 0.9 + 1.35 * (i + 1) - 0.05
    add(kick(), td, 0.45)
    add(noise(0.08, 0.02), td, 0.25)
    add(tone(note(76 + (i % 4) * 2), 0.15, "tri", 0.002, 0.08), td + 0.03, 0.18)
# cronômetro acelerado
t = 36.8
while t < 39.5:
    add(hat(), t, 0.35)
    add(tone(2000, 0.02, "sine", 0.001, 0.01), t, 0.12)
    t += 0.12
add(tone(note(43), 0.7, "square", 0.004, 0.4), 39.5, 0.3)
add(tone(note(44), 0.7, "square", 0.004, 0.4), 39.5, 0.2)
# opção 1 volta / opção 2 troca
add(tone(note(84), 0.2, "sine", 0.002, 0.1), 36 + 8.3, 0.2)
# penalidades
for i in range(5):
    add(tone(note(60 - i * 2), 0.12, "tri", 0.002, 0.08), 45 + 2.0 + i * 0.25, 0.2)
# premiação
for i, m in enumerate((72, 76, 79, 84)):
    add(tone(note(m), 0.5, "square", 0.004, 0.3), 50.3 + i * 0.12, 0.12)
for tt in (51.1, 51.4, 51.7):
    add(kick(), tt, 0.4)
for i in range(6):
    add(tone(note(96 + (i % 3) * 3), 0.1, "sine", 0.001, 0.05), 52.3 + i * 0.05, 0.12)
# final: pizza & picolé
add(tone(note(60), 0.3, "sine", 0.002, 0.1) * 1, 55.45, 0.3)
for i, m in enumerate((72, 76, 79, 84, 88)):
    add(tone(note(m), 0.6, "square", 0.004, 0.35), 56.2 + i * 0.06, 0.1)
for m in (48, 60, 64, 67, 72):
    add(tone(note(m), 2.0, "tri", 0.01, 0.8), 59.0, 0.12)

# fade final e normalização
fade = np.ones(N)
fn = int(0.8 * SR)
fade[-fn:] = np.linspace(1, 0, fn)
out *= fade
out = np.tanh(out * 1.2)
out /= np.max(np.abs(out)) + 1e-9
out *= 0.85
pcm = (out * 32767).astype(np.int16)

with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("ok", sys.argv[1])
