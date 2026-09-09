from pathlib import Path

from PIL import Image

ASSETS = Path(r"C:\Users\dgknb\.cursor\projects\c-Users-dgknb-Desktop-Proje-Mobil\assets")
OUT = Path(r"c:\Users\dgknb\Desktop\Proje\Mobil\aislam-mobile\store-listing")
OUT.mkdir(parents=True, exist_ok=True)


def cover_resize(img: Image.Image, tw: int, th: int) -> Image.Image:
    scale = max(tw / img.width, th / img.height)
    nw, nh = int(img.width * scale), int(img.height * scale)
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return img.crop((left, top, left + tw, top + th))


def ensure_min_side(img: Image.Image, min_side: int = 1080) -> Image.Image:
    w, h = img.size
    m = min(w, h)
    if m >= min_side:
        return img
    scale = min_side / m
    return img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)


# Feature graphic 1024x500
feat = Image.open(ASSETS / "play-feature-graphic.png").convert("RGB")
feat = cover_resize(feat, 1024, 500)
feat_path = OUT / "feature-graphic-1024x500.png"
feat.save(feat_path, "PNG", optimize=True)
print("feature", feat.size, feat_path)

# Icon 512x512
icon = Image.open(r"c:\Users\dgknb\Desktop\Proje\Mobil\aislam-mobile\assets\icon.png").convert("RGBA")
icon = icon.resize((512, 512), Image.Resampling.LANCZOS)
icon_path = OUT / "icon-512.png"
icon.save(icon_path, "PNG", optimize=True)
print("icon", icon.size, icon_path)

# Screenshots >= 1080 on shortest side
shots = [
    ("screenshot-1-ezan.png", "phone-1-ezan.png"),
    ("screenshot-2-kuran.png", "phone-2-kuran.png"),
    ("screenshot-3-egitim.png", "phone-3-egitim.png"),
    ("screenshot-4-sohbet.png", "phone-4-sohbet.png"),
]
for src_name, dst_name in shots:
    img = Image.open(ASSETS / src_name).convert("RGB")
    img = ensure_min_side(img, 1080)
    # Keep portrait; cap longest side reasonably for upload size
    w, h = img.size
    if max(w, h) > 1920:
        scale = 1920 / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    dst = OUT / dst_name
    img.save(dst, "PNG", optimize=True)
    print("shot", img.size, dst)

print("done")
