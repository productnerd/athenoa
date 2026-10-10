# Generates src/assets/illustrations/waves.svg: a band of flowing parallel lines that repeats exactly
# every 1600 units, drawn twice side by side (3200 wide) so it can slide sideways in an endless loop.
import math, os

W, H, LINES, STEP = 1600, 120, 6, 10
out = []
for i in range(LINES):
    base = 24 + i * 14.5
    a1, k1, p1 = 8.5 - i * 0.5, 2, 0.35 * i
    a2, k2, p2 = 3.2 + (i % 3) * 0.6, 3, 1.1 + 0.5 * i
    a3, k3, p3 = 1.6, 5, 2.0 + 0.9 * i
    pts = []
    for x in range(0, 2 * W + 1, STEP):
        t = 2 * math.pi * x / W
        y = base + a1 * math.sin(k1 * t + p1) + a2 * math.sin(k2 * t + p2) + a3 * math.sin(k3 * t + p3)
        pts.append((x, round(y, 1)))
    d = f"M{pts[0][0]} {pts[0][1]}" + "".join(f"L{x} {y}" for x, y in pts[1:])
    out.append(f'<path d="{d}"/>')
svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {2 * W} {H}" preserveAspectRatio="xMinYMid meet" fill="none" '
    f'stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' + "".join(out) + "</svg>\n"
)
path = os.path.join(os.path.dirname(__file__), "..", "..", "src", "assets", "illustrations", "waves.svg")
open(path, "w").write(svg)
print(len(svg), "bytes")
