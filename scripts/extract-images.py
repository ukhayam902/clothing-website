#!/usr/bin/env python3
"""Extract images + data from the static UK Threads export.

Source (read-only): ~/workspace/deploy-clothing-website/index.html
Outputs (in this repo):
  public/images/product-01.webp ... product-30.webp
  public/images/hero-*.webp, style-split.webp, category-*.webp
  scripts/products.json  (30-product manifest + FAQs + categories)
"""
import base64
import json
import os
import re
import sys

SRC = os.path.expanduser("~/workspace/deploy-clothing-website/index.html")
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(APP, "public", "images")
os.makedirs(OUT, exist_ok=True)

h = open(SRC, encoding="utf-8").read()
print("source bytes:", len(h))

URI_RE = re.compile(r'data:image/([a-z]+);base64,([A-Za-z0-9+/=]+)')


def save(b64: str, name: str, subtype: str) -> str:
    raw = base64.b64decode(b64)
    fn = name if "." in name else f"{name}.{subtype}"
    path = os.path.join(OUT, fn)
    with open(path, "wb") as f:
        f.write(raw)
    return fn, len(raw)


# ---- hero: main image + 4 rail looks (label + data-hero + thumb) ----
hero = {}
m = re.search(r'<img class="hero-img" id="heroImg" src="(data:image/[a-z]+;base64,[A-Za-z0-9+/=]+)"', h)
assert m, "hero main image not found"
sub, b64 = URI_RE.match(m.group(1)).groups()
fn, n = save(b64, "hero-main", sub)
hero["main"] = {"file": fn, "bytes": n, "alt": "Store owner modelling a black casual shirt over a white tee"}
print("hero main:", fn, n)

for label in ["Black shirt look", "White tee look", "Green polo look", "Beige shirt look"]:
    m = re.search(r'aria-label="%s"><img src="(data:image/[a-z]+;base64,[A-Za-z0-9+/=]+)"' % re.escape(label), h)
    assert m, f"hero thumb {label} not found"
    sub, b64 = URI_RE.match(m.group(1)).groups()
    key = "hero-" + label.lower().replace(" look", "").replace(" ", "-")
    fn, n = save(b64, key, sub)
    hero[key] = {"file": fn, "bytes": n, "alt": label}
    print("hero thumb:", key, fn, n)

# ---- "Style That Speaks" split image ----
m = re.search(r'STYLE SPLIT -->\s*<section[^>]*>\s*<div class="wrap split">\s*<div class="ph"><img src="(data:image/[a-z]+;base64,[A-Za-z0-9+/=]+)"', h)
assert m, "style split image not found"
sub, b64 = URI_RE.match(m.group(1)).groups()
fn, n = save(b64, "style-split", sub)
hero["style-split"] = {"file": fn, "bytes": n,
                       "alt": "Store owner wearing a sand beige linen shirt with white trousers"}
print("style split:", fn, n)

# ---- products ----
prod_re = re.compile(
    r'\{id:(\d+),\s*name:"([^"]+)",\s*cat:"([^"]+)",\s*catLabel:"([^"]+)",\s*price:(\d+),'
    r'\s*was:(null|\d+),\s*best:(true|false),\s*img:"(data:image/[a-z]+;base64,[A-Za-z0-9+/=]+)",'
    r'\s*fabric:"([^"]*)",\s*desc:"([^"]*)"\s*\}'
)
products = []
for m in prod_re.finditer(h):
    pid, name, cat, cat_label, price, was, best, img, fabric, desc = m.groups()
    sub, b64 = URI_RE.match(img).groups()
    fn, n = save(b64, f"product-{int(pid):02d}", sub)
    products.append({
        "id": int(pid), "name": name, "category": cat, "categoryLabel": cat_label,
        "price": int(price), "was": None if was == "null" else int(was),
        "bestseller": best == "true", "image": f"/images/{fn}", "imageBytes": n,
        "fabric": fabric, "description": desc,
    })
    print(f"product {pid:>2}: {name} ({cat}) Rs. {price} -> {fn} ({n} bytes)")
assert len(products) == 30, f"expected 30 products, got {len(products)}"

# ---- categories ----
cat_re = re.compile(
    r'\{key:"([^"]+)",\s*name:"([^"]+)",\s*sub:"([^"]+)",\s*img:"(data:image/[a-z]+;base64,[A-Za-z0-9+/=]+)"\}'
)
categories = []
for m in cat_re.finditer(h):
    key, name, sub_label, img = m.groups()
    sub, b64 = URI_RE.match(img).groups()
    fn, n = save(b64, f"category-{key}", sub)
    categories.append({"id": key, "name": name, "sub": sub_label, "image": f"/images/{fn}", "imageBytes": n})
    print(f"category {key}: {name} ({sub_label}) -> {fn} ({n} bytes)")
assert len(categories) == 6, f"expected 6 categories, got {len(categories)}"

# ---- FAQs ----
faq_re = re.compile(r'\{q:"([^"]*)",\s*a:"([^"]*)"\}')
faqs = [{"q": q, "a": a} for q, a in faq_re.findall(h)]
print("faqs:", len(faqs))
assert len(faqs) == 6, f"expected 6 FAQs, got {len(faqs)}"

manifest = {"hero": hero, "products": products, "categories": categories, "faqs": faqs}
with open(os.path.join(APP, "scripts", "products.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
print("manifest written:", os.path.join(APP, "scripts", "products.json"))
print("total images in public/images:", len(os.listdir(OUT)))
