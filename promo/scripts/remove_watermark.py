from PIL import Image, ImageDraw, ImageFont
import os

SRC_DIR = "/Users/soma/Downloads"
OUT_DIR = "/Users/soma/Desktop/BOATBANK/promo/out"
FONT_PATH = "/System/Library/Fonts/Menlo.ttc"
FONT_SIZE = 16
TEXT_COLOR = (90, 100, 114)  # #5a6472

# Strategy:
# - Promo 1/2/3: erase the whole "boatbank.jp ✦" area, then redraw only "boatbank.jp"
# - Promo 4: "boatbank.jp" is on the left (clean), only a standalone ✦ on the right
#            → erase only the narrow ✦ area
JOBS = [
    # (src, out, erase_rect (x,y,w,h), redraw_pos or None)
    ("IMG_5611.PNG", "promo-1-clean.png", (1155, 700, 200, 45), (1200, 718)),
    ("IMG_5612.PNG", "promo-2-clean.png", (1155, 700, 200, 45), (1200, 718)),
    ("IMG_5613.PNG", "promo-3-clean.png", (1155, 700, 200, 45), (1200, 718)),
    ("IMG_5614.PNG", "promo-4-clean.png", (1282, 705, 60, 38), None),
]


def erase_region(img, x, y, w, h):
    # Copy the strip immediately above the region (same height)
    sample_top = max(0, y - h)
    strip = img.crop((x, sample_top, x + w, sample_top + h))
    img.paste(strip, (x, y))


def redraw_text(img, pos, text):
    font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
    draw = ImageDraw.Draw(img)
    draw.text(pos, text, fill=TEXT_COLOR, font=font)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for src_name, out_name, rect, redraw in JOBS:
        src = os.path.join(SRC_DIR, src_name)
        out = os.path.join(OUT_DIR, out_name)
        img = Image.open(src).convert("RGB")
        erase_region(img, *rect)
        if redraw is not None:
            redraw_text(img, redraw, "boatbank.jp")
        img.save(out, optimize=True)
        print(f"wrote {out}")


if __name__ == "__main__":
    main()
