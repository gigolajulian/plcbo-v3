"""Approximate each mark with a set of circles — the 'blob estimation'.

Greedy medial-axis packing: the deepest point inside the shape is the centre of the
largest circle that fits, so take it, erase that disc, and repeat. What comes out is a
set of blobs that reads as the letter when they are unioned, and as one mass when they
are pulled together.

Both marks are packed to the SAME count so blob i has a home in each shape and can
simply travel between them.
"""
import json, numpy as np
from PIL import Image

N = 128                # must match BLOBS in blob-field.ts
FRAME = (1400, 506)    # the shared frame both masks already live in

def distance_transform(mask):
    """Two-pass chamfer DT: distance from each inside pixel to the nearest outside one."""
    big = 1e9
    d = np.where(mask, big, 0.0)
    h, w = d.shape
    # forward
    for y in range(h):
        for x in range(w):
            if d[y, x] == 0: continue
            best = d[y, x]
            if y > 0:
                best = min(best, d[y-1, x] + 1.0)
                if x > 0:   best = min(best, d[y-1, x-1] + 1.41421)
                if x < w-1: best = min(best, d[y-1, x+1] + 1.41421)
            if x > 0:       best = min(best, d[y, x-1] + 1.0)
            d[y, x] = best
    # backward
    for y in range(h-1, -1, -1):
        for x in range(w-1, -1, -1):
            if d[y, x] == 0: continue
            best = d[y, x]
            if y < h-1:
                best = min(best, d[y+1, x] + 1.0)
                if x > 0:   best = min(best, d[y+1, x-1] + 1.41421)
                if x < w-1: best = min(best, d[y+1, x+1] + 1.41421)
            if x < w-1:     best = min(best, d[y, x+1] + 1.0)
            d[y, x] = best
    return d

def pack(path, n, scale=0.4):
    img = Image.open(path).convert('RGBA')
    w, h = int(FRAME[0] * scale), int(FRAME[1] * scale)
    a = np.array(img.resize((w, h), Image.LANCZOS))[:, :, 3]
    mask = a > 140
    d = distance_transform(mask)

    out = []
    for _ in range(n):
        idx = int(np.argmax(d))
        y, x = divmod(idx, w)
        r = float(d[y, x])
        if r < 1.0:
            break
        out.append((x, y, r))
        # erase a disc a little smaller than the circle, so neighbours still overlap and
        # the union stays one body rather than a string of beads
        yy, xx = np.ogrid[:h, :w]
        d[((xx - x) ** 2 + (yy - y) ** 2) < (r * 0.58) ** 2] = 0.0

    # pad by repeating the largest blob, so every shape ships exactly n
    while len(out) < n:
        out.append(out[0])

    # normalise into the frame's own space: x in [-aspect/2, aspect/2], y in [-0.5, 0.5]
    aspect = FRAME[0] / FRAME[1]
    return [
        [round((x / w - 0.5) * aspect, 5), round((y / h - 0.5), 5), round(r / h, 5)]
        for (x, y, r) in out
    ]

a = pack('public/morph-a.png', N)
b = pack('public/morph-b.png', N)
# pair left-to-right so the swarm reads as one coherent drift rather than a shuffle
a.sort(key=lambda c: c[0])
b.sort(key=lambda c: c[0])

print(json.dumps({'count': N, 'aspect': FRAME[0] / FRAME[1], 'mark': a, 'word': b}))
