# Builds src/assets/illustrations/waves.svg from waves-source.svg (the hand-checked drawing of five
# flowing lines) and makes each line vibrate in place like a plucked string: the two ends stay put and
# the middle sways a few units, each line at its own slow pace. Nothing travels sideways.
import math, os, re

here = os.path.dirname(__file__)
src = open(os.path.join(here, "waves-source.svg")).read()
W = 1600


def sway(d, amp, wavelength, phase):
    """Shift every point of the path up or down by a smooth wave that is zero at both ends."""
    tokens = re.findall(r"[A-Za-z]|-?\d*\.?\d+", d)
    out, nums = [], []

    def flush():
        for i in range(0, len(nums), 2):
            x, y = nums[i], nums[i + 1]
            envelope = math.sin(math.pi * max(0.0, min(1.0, x / W)))
            y2 = y + amp * envelope * math.sin(2 * math.pi * x / wavelength + phase)
            out.append(f"{x:g} {y2:.1f}")
        nums.clear()

    for token in tokens:
        if token.isalpha():
            flush()
            out.append(token)
        else:
            nums.append(float(token))
    flush()
    return re.sub(r" ?([A-Za-z]) ?", r"\1", " ".join(out))


paths = re.findall(r'<path d="([^"]+)"\s*/>', src)
assert len(paths) == 5, len(paths)
ease = "0.45 0 0.55 1"
body = []
for i, d in enumerate(paths):
    rest = sway(d, 0, 800, 0)  # same structure and number format as the variants
    a = sway(d, 5.5, 820 + 70 * i, 0.9 * i)
    b = sway(d, -4.5, 560 + 50 * i, 1.7 + 0.6 * i)
    dur = 9 + 1.6 * i
    body.append(
        f'<path d="{rest}"><animate attributeName="d" dur="{dur:g}s" begin="-{1.3 * i:g}s" repeatCount="indefinite" '
        f'calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" keySplines="{ease};{ease};{ease};{ease}" '
        f'values="{rest};{a};{rest};{b};{rest}"/></path>'
    )
head = re.match(r"<svg[^>]*>", src).group(0)
svg = head + "".join(body) + "</svg>\n"
open(os.path.join(here, "..", "..", "src", "assets", "illustrations", "waves.svg"), "w").write(svg)
print(len(svg), "bytes,", len(paths), "lines")
