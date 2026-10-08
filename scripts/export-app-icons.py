"""Export the approved bitmap without generating or repainting its artwork."""
from pathlib import Path
import json
import shutil
import zipfile

from PIL import Image, ImageCms, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "app-icons"
SOURCE = PACK / "source/lukomorye-approved-1254.png"
ART = Image.open(SOURCE).convert("RGB")
ICC = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()
LANCZOS = Image.Resampling.LANCZOS
exports = []


def save(relative, size, art=ART, mode="RGB"):
    path = PACK / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    art.resize((size, size), LANCZOS).convert(mode).save(
        path, optimize=True, icc_profile=ICC
    )
    exports.append({"file": relative, "size": [size, size], "mode": mode})
    return path


# Repeat only background edge pixels into the new margins; feather the join.
# The artwork is inset to protect it when the OS masks the icon to a circle.
extent = 1024
inset = round(extent * 0.70)
offset = (extent - inset) // 2
small = ART.resize((inset, inset), LANCZOS)
safe = small.resize((extent, extent), LANCZOS)
safe.paste(small.crop((0, 0, inset, 1)).resize((inset, offset)), (offset, 0))
safe.paste(small.crop((0, inset - 1, inset, inset)).resize((inset, extent - offset - inset)), (offset, offset + inset))
safe.paste(small.crop((0, 0, 1, inset)).resize((offset, inset)), (0, offset))
safe.paste(small.crop((inset - 1, 0, inset, inset)).resize((extent - offset - inset, inset)), (offset + inset, offset))
for x, y, sx, sy in [(0, 0, 0, 0), (offset + inset, 0, inset - 1, 0), (0, offset + inset, 0, inset - 1), (offset + inset, offset + inset, inset - 1, inset - 1)]:
    safe.paste(small.getpixel((sx, sy)), (x, y, x + offset + 1, y + offset + 1))
safe.paste(small, (offset, offset))
safe = safe.filter(ImageFilter.GaussianBlur(8))
blend = Image.new("L", (extent, extent), 0)
ImageDraw.Draw(blend).rectangle((offset + 12, offset + 12, offset + inset - 12, offset + inset - 12), fill=255)
blend = blend.filter(ImageFilter.GaussianBlur(7))
sharp = safe.copy()
sharp.paste(small, (offset, offset))
safe = Image.composite(sharp, safe, blend)

save("source/lukomorye-master-1024.png", 1024)
save("source/lukomorye-safe-1024.png", 1024, safe)
save("stores/app-store-1024.png", 1024)
save("stores/google-play-512.png", 512, mode="RGBA")
for size in [256, 512, 1024]:
    save(f"stores/universal-{size}.png", size)

for size in [16, 24, 32, 48, 64, 96, 128, 144, 152, 180, 192, 256, 384, 512, 1024]:
    save(f"web/icon-{size}.png", size)
for size in [192, 512, 1024]:
    save(f"web/icon-maskable-{size}.png", size, safe)
ART.resize((256, 256), LANCZOS).save(PACK / "web/favicon.ico", sizes=[(s, s) for s in [16, 24, 32, 48, 64, 128, 256]])

# Traditional Xcode asset catalog: opaque PNGs, no pre-rendered corner mask.
ios = []
for idiom, sizes, scales in [("iphone", [20, 29, 40, 60], [2, 3]), ("ipad", [20, 29, 40, 76], [1, 2])]:
    for points in sizes:
        for scale in scales:
            px = points * scale
            name = f"icon-{idiom}-{points}@{scale}x.png"
            save(f"ios/AppIcon.appiconset/{name}", px)
            ios.append({"idiom": idiom, "size": f"{points}x{points}", "scale": f"{scale}x", "filename": name})
save("ios/AppIcon.appiconset/icon-ipad-83.5@2x.png", 167)
ios.append({"idiom": "ipad", "size": "83.5x83.5", "scale": "2x", "filename": "icon-ipad-83.5@2x.png"})
save("ios/AppIcon.appiconset/icon-app-store-1024.png", 1024)
ios.append({"idiom": "ios-marketing", "size": "1024x1024", "scale": "1x", "filename": "icon-app-store-1024.png"})
(PACK / "ios/AppIcon.appiconset/Contents.json").write_text(json.dumps({"images": ios, "info": {"version": 1, "author": "xcode"}}, indent=2) + "\n")

mac = []
for points in [16, 32, 128, 256, 512]:
    for scale in [1, 2]:
        name = f"icon-{points}@{scale}x.png"
        save(f"macos/AppIcon.appiconset/{name}", points * scale)
        mac.append({"idiom": "mac", "size": f"{points}x{points}", "scale": f"{scale}x", "filename": name})
(PACK / "macos/AppIcon.appiconset/Contents.json").write_text(json.dumps({"images": mac, "info": {"version": 1, "author": "xcode"}}, indent=2) + "\n")
ART.resize((1024, 1024), LANCZOS).save(PACK / "macos/lukomorye.icns", sizes=[(s, s) for s in [16, 32, 64, 128, 256, 512, 1024]])

for density, size in [("mdpi", 48), ("hdpi", 72), ("xhdpi", 96), ("xxhdpi", 144), ("xxxhdpi", 192)]:
    save(f"android/res/mipmap-{density}/ic_launcher.png", size)
    save(f"android/res/mipmap-{density}/ic_launcher_round.png", size, safe)

for size in [44, 50, 71, 150, 256, 310, 512, 1024]:
    save(f"windows/icon-{size}.png", size)
shutil.copy2(PACK / "web/favicon.ico", PACK / "windows/lukomorye.ico")

# A visual check sheet; masking here is preview-only.
sheet = Image.new("RGB", (1240, 800), "#f4efdb")
draw = ImageDraw.Draw(sheet)
font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 22)
small_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
draw.text((32, 20), "LUKOMORYE / ICON EXPORTS", font=font, fill="#2e4437")
for index, (label, art, shape) in enumerate([("Store / square", ART, "square"), ("iOS / rounded preview", ART, "rounded"), ("Android / circle preview", safe, "circle")]):
    x, y, size = 40 + index * 400, 72, 350
    tile = art.resize((size, size), LANCZOS)
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    if shape == "circle":
        md.ellipse((0, 0, size - 1, size - 1), fill=255)
    elif shape == "rounded":
        md.rounded_rectangle((0, 0, size - 1, size - 1), radius=round(size * .23), fill=255)
    else:
        md.rectangle((0, 0, size, size), fill=255)
    sheet.paste(tile, (x, y), mask)
    draw.text((x, y + size + 16), label, font=small_font, fill="#2e4437")
draw.text((40, 500), "Actual sizes: browser favicon and launcher icons", font=font, fill="#2e4437")
x = 40
for size in [16, 24, 32, 48, 64, 96, 128, 180, 192]:
    sheet.paste(ART.resize((size, size), LANCZOS), (x, 558 + (192 - size) // 2))
    draw.text((x, 760), str(size), font=small_font, fill="#2e4437")
    x += size + 36
sheet.save(PACK / "preview.png", optimize=True)

for source, destination in [("web/favicon.ico", "favicon.ico"), ("web/icon-180.png", "icon-180.png"), ("web/icon-192.png", "icon-192.png"), ("web/icon-512.png", "icon-512.png"), ("web/icon-maskable-512.png", "icon-maskable-512.png")]:
    shutil.copy2(PACK / source, ROOT / destination)

(PACK / "export-manifest.json").write_text(json.dumps({"source": str(SOURCE.relative_to(ROOT)), "exports": exports}, indent=2) + "\n")
for item in exports:
    path = PACK / item["file"]
    with Image.open(path) as check:
        assert list(check.size) == item["size"], path
        assert check.mode == item["mode"], path
        if "A" in check.mode:
            assert check.getchannel("A").getextrema() == (255, 255), path
        assert check.info.get("icc_profile"), path
assert (PACK / "stores/google-play-512.png").stat().st_size <= 1024 * 1024
with Image.open(PACK / "web/favicon.ico") as check:
    assert check.ico.sizes() == {(s, s) for s in [16, 24, 32, 48, 64, 128, 256]}
with zipfile.ZipFile(PACK / "lukomorye-icons.zip", "w", zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(PACK.rglob("*")):
        if path.is_file() and path.suffix != ".zip":
            archive.write(path, path.relative_to(PACK))
print(f"Exported and verified {len(exports)} PNGs, ICO, ICNS, 2 Xcode catalogs and ZIP: {PACK}")
