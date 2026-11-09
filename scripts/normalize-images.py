#!/usr/bin/env python3
"""Normalize every image in public/images/ to a uniform 3:4 portrait, 900x1200 px.

Crop rule:
  - image wider than 3:4  -> center-crop the width
  - image taller than 3:4 -> crop the height anchored at the TOP (y=0),
                             so heads/faces are never cut off
Then resize to 900x1200 with LANCZOS. Original format/extension is kept
(webp stays webp, jpeg stays jpeg), quality 85. Filenames are unchanged.
Run from the app root:  python3 scripts/normalize-images.py
"""
import os
import sys

from PIL import Image

TARGET_W, TARGET_H = 900, 1200
TARGET_RATIO = TARGET_W / TARGET_H  # 0.75
QUALITY = 85

IMG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "images")


def normalize(path: str) -> tuple[int, int]:
    with Image.open(path) as im:
        w, h = im.size
        ratio = w / h
        if ratio > TARGET_RATIO:
            # Too wide: center-crop the width.
            new_w = int(round(h * TARGET_RATIO))
            left = (w - new_w) // 2
            box = (left, 0, left + new_w, h)
        elif ratio < TARGET_RATIO:
            # Too tall: crop the height anchored at the top (y=0).
            new_h = int(round(w / TARGET_RATIO))
            box = (0, 0, w, new_h)
        else:
            box = (0, 0, w, h)
        cropped = im.crop(box)
        resized = cropped.resize((TARGET_W, TARGET_H), Image.LANCZOS)
        ext = os.path.splitext(path)[1].lower()
        if ext == ".webp":
            resized.save(path, "WEBP", quality=QUALITY)
        elif ext in (".jpg", ".jpeg"):
            resized.convert("RGB").save(path, "JPEG", quality=QUALITY)
        else:
            resized.save(path, quality=QUALITY)
        return (w, h)


def main() -> int:
    files = sorted(f for f in os.listdir(IMG_DIR) if os.path.isfile(os.path.join(IMG_DIR, f)))
    if not files:
        print("No images found in", IMG_DIR)
        return 1
    for name in files:
        path = os.path.join(IMG_DIR, name)
        old = normalize(path)
        with Image.open(path) as im:
            print(f"{name}: {old[0]}x{old[1]} -> {im.size[0]}x{im.size[1]}")
    # Verification pass
    bad = []
    for name in files:
        with Image.open(os.path.join(IMG_DIR, name)) as im:
            if im.size != (TARGET_W, TARGET_H):
                bad.append((name, im.size))
    if bad:
        print("FAILED — not 900x1200:", bad)
        return 1
    print(f"OK — all {len(files)} images are 900x1200")
    return 0


if __name__ == "__main__":
    sys.exit(main())
