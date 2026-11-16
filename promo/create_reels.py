#!/usr/bin/env python3
"""Render a vertical Aracim Pro promo from the real Google Play listing assets.

This script does not alter the Android application or invent application screens.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import io
import math
import random
import requests
import subprocess
import wave
import numpy as np
import qrcode

ROOT = Path("promo")
ASSETS = ROOT / "assets"
WORK = ROOT / "work"
OUTPUT = ROOT / "video"
for folder in (ASSETS, WORK, OUTPUT):
    folder.mkdir(parents=True, exist_ok=True)

PLAY_URL = "https://play.google.com/store/apps/details?id=com.aracimpro.app"
BASE = "https://play-lh.googleusercontent.com/"
SCREEN_IDS = [
    "LWFDdtP6gnn6zUFtu5gqrTWKSmzeGwGkqhPfbpGwZtMN0wTV8R5mAzlQ1mNTKXQ_FsIeyZR-jdlx1W85YdQ7USM",
    "cuFpCFUKOURZDLkvd_Yn6pItboht56kV_dFOu3AGFlxTGmxlruowkd5zNqai6asck6ZS631VmGoqGDMQIeRcr70",
    "GodNeAlRdgSqNdE5SuuxMtW43OwpCiiNp8IRQiFLAaHyscKPmhDgXk0q8PmCypQ_td8JJSR5WQFIRTag5nZJhp0",
    "LKyZJULC9y-j_XsZxR_6exK4HsxgBuCNoiHj4BMMHEYHJkn2pRNskgS4sFB4sX5FKcRTj83j222pptxFUJrGjg",
]
ICON_ID = "j53IAOTRf-kowBUg2LnitM_5vKpkLufRsgvATZjgI0QY2_-ub18nfcLt4qbE3yD3CojBjo--uH21aR7bUMsf"
W, H = 1080, 1920
DURATION = 5.5
FPS = 30
TOTAL = 27.5

def fetch_image(image_id, filename, size="s1600"):
    url = BASE + image_id + "=" + size
    response = requests.get(url, timeout=35, headers={"User-Agent": "Mozilla/5.0"})
    response.raise_for_status()
    picture = Image.open(io.BytesIO(response.content)).convert("RGB")
    if picture.width < 150 or picture.height < 150:
        raise RuntimeError("Google Play asset is unexpectedly small: " + filename)
    picture.save(ASSETS / filename, quality=94)
    return picture

print("Fetching authentic app artwork from Google Play...")
screens = [fetch_image(img, "play_screen_%s.jpg" % (i + 1)) for i, img in enumerate(SCREEN_IDS)]
logo = fetch_image(ICON_ID, "play_icon.jpg", "s512")
assert len(screens) == 4

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)

def center_text(draw, y, lines, size=70, fill=(255, 255, 255), gap=20, bold=True):
    f = font(size, bold)
    for line in lines:
        bb = draw.textbbox((0, 0), line, font=f)
        tw = bb[2] - bb[0]
        draw.text(((W - tw) // 2, y), line, font=f, fill=fill, stroke_width=1)
        y += (bb[3] - bb[1]) + gap
    return y

def base_layer(image, index):
    # Actual app imagery is used as the background, with cinematic lighting.
    layer = ImageOps.fit(image, (W, H), method=Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(48)).convert("RGBA")
    dark = Image.new("RGBA", (W, H), (4, 10, 27, 204))
    layer.alpha_composite(dark)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((-370, -140, 990, 980), fill=(16, 119, 245, 73))
    gd.ellipse((300, 1170, 1380, 2310), fill=(15, 185, 230, 54))
    glow = glow.filter(ImageFilter.GaussianBlur(170))
    layer.alpha_composite(glow)
    draw = ImageDraw.Draw(layer)
    for j in range(0, 8):
        x = -600 + j * 265 + index * 40
        draw.line((x, 0, x + 510, H), fill=(76, 154, 255, 14), width=3)
    return layer

def draw_photo_card(layer, photo, y=640):
    image = ImageOps.contain(photo, (950, 745), method=Image.Resampling.LANCZOS)
    x = (W - image.width) // 2
    y = y + max(0, (640 - image.height) // 2)
    border = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    bd = ImageDraw.Draw(border)
    bd.rounded_rectangle((x - 18, y - 18, x + image.width + 18, y + image.height + 18), radius=30, fill=(5, 20, 46, 250), outline=(50, 178, 255, 230), width=5)
    shadow = border.filter(ImageFilter.GaussianBlur(42))
    layer.alpha_composite(shadow)
    layer.alpha_composite(border)
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, image.width, image.height), radius=18, fill=255)
    layer.paste(image, (x, y), mask)

def create_slide(i, title_lines, subtitle_lines):
    source = screens[min(i, 3)]
    layer = base_layer(source, i)
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle((65, 115, 455, 184), radius=24, fill=(12, 91, 175, 165), outline=(59, 195, 255, 200), width=2)
    d.text((87, 128), "ARACIM PRO", font=font(37, True), fill=(241, 248, 255))
    center_text(d, 305, title_lines, 70, (255, 255, 255), 15, True)
    center_text(d, 515, subtitle_lines, 31, (188, 226, 255), 12, False)
    draw_photo_card(layer, source, 725)
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle((120, 1536, 960, 1640), radius=30, fill=(13, 121, 229, 235))
    center_text(d, 1561, ["GOOGLE PLAY'DE ÜCRETSİZ"], 33, (255, 255, 255), 0, True)
    center_text(d, 1700, ["@aracimproapp"], 36, (187, 219, 250), 0, False)
    path = WORK / ("slide_%02d.png" % (i + 1))
    layer.convert("RGB").save(path)
    return path

slides = []
slides.append(create_slide(0, ["ARACININ DİJİTAL", "MERKEZİ"], ["Araç bilgileri tek bir uygulamada"]))
slides.append(create_slide(1, ["AKILLI GARAJ"], ["Aracını kolayca yönet"]))
slides.append(create_slide(2, ["YAKIT VE MASRAF"], ["Harcamalarını takip et"]))
slides.append(create_slide(3, ["BAKIM TAKİBİ"], ["Bakım kayıtlarını düzenle"]))

layer = base_layer(screens[0], 4)
d = ImageDraw.Draw(layer)
center_text(d, 220, ["ARACIM PRO"], 100, (255, 255, 255), 10, True)
center_text(d, 380, ["ARACINLA İLGİLİ HER ŞEY", "CEBİNDE"], 43, (201, 232, 255), 16, True)
icon = ImageOps.fit(logo, (268, 268), method=Image.Resampling.LANCZOS).convert("RGBA")
mask = Image.new("L", icon.size, 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, 267, 267), radius=55, fill=255)
layer.paste(icon, (406, 585), mask)
center_text(d, 960, ["ŞİMDİ ÜCRETSİZ İNDİR"], 50, (255, 255, 255), 14, True)
qr = qrcode.QRCode(border=2, box_size=10)
qr.add_data(PLAY_URL)
qr.make(fit=True)
qrimg = qr.make_image(fill_color="#0c2240", back_color="white").convert("RGB")
qrimg = qrimg.resize((312, 312), Image.Resampling.NEAREST)
layer.paste(qrimg, (384, 1070))
d = ImageDraw.Draw(layer)
center_text(d, 1450, ["GOOGLE PLAY"], 58, (99, 208, 255), 15, True)
center_text(d, 1590, ["play.google.com/store/apps/", "details?id=com.aracimpro.app"], 27, (230, 241, 255), 18, False)
center_text(d, 1770, ["PROFİLDEKİ BAĞLANTIDAN İNDİR"], 26, (198, 231, 255), 0, True)
end_slide = WORK / "slide_05.png"
layer.convert("RGB").save(end_slide)
slides.append(end_slide)

print("Creating original, royalty-free instrumental beat...")
rate = 32000
length = int(TOTAL * rate)
music = np.zeros(length, dtype=np.float32)
notes = [65.41, 77.78, 98.0, 87.31]
for beat in np.arange(0, TOTAL, 0.5):
    start = int(beat * rate)
    n = min(int(0.30 * rate), length - start)
    t = np.arange(n, dtype=np.float32) / rate
    # Deep dance kick with falling pitch and a short crisp click.
    kick = 0.42 * np.sin(2 * np.pi * (70 * t + 28 * np.exp(-18 * t) * t)) * np.exp(-13 * t)
    music[start:start+n] += kick
for tick in np.arange(0, TOTAL, 0.25):
    start = int(tick * rate)
    n = min(int(0.07 * rate), length - start)
    t = np.arange(n, dtype=np.float32) / rate
    rng = np.random.default_rng(int(tick * 1000) + 7)
    hat = rng.normal(0, 0.09, n).astype(np.float32) * np.exp(-48 * t)
    music[start:start+n] += hat
for bar in np.arange(0, TOTAL, 2):
    for step, freq in enumerate(notes):
        start = int((bar + step * 0.5) * rate)
        if start >= length:
            continue
        n = min(int(0.43 * rate), length - start)
        t = np.arange(n, dtype=np.float32) / rate
        bass = 0.12 * (np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * 2 * freq * t))
        music[start:start+n] += bass * (1 - np.exp(-30 * t)) * np.exp(-3.1 * t)
peak = max(float(np.max(np.abs(music))), 0.001)
music = np.clip(music / peak * 0.70, -1.0, 1.0)
with wave.open(str(WORK / "music.wav"), "wb") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(rate)
    wf.writeframes((music * 32767).astype("<i2").tobytes())

narration = (
    "Aracınla ilgili her şey artık cebinde! "
    "Aracım Pro ile araç bilgilerini tek yerden yönet. "
    "Yakıt ve masraflarını takip et. "
    "Bakım kayıtlarını düzenle. "
    "Aracım Pro, şimdi Google Play'de. "
    "Profildeki bağlantıdan ücretsiz indir!"
)
voice_file = WORK / "voice.mp3"
try:
    subprocess.run(["edge-tts", "--voice", "tr-TR-AhmetNeural", "--text", narration, "--write-media", str(voice_file)], check=True, timeout=65)
    if voice_file.stat().st_size < 1000:
        raise RuntimeError("Empty TTS")
    print("Turkish voice-over prepared.")
except Exception as e:
    print("Neural TTS unavailable, trying a second free voice service:", e)
    try:
        from gtts import gTTS
        gTTS(text=narration, lang="tr").save(str(voice_file))
    except Exception as inner:
        print("Voice generation failed; exporting with original music instead:", inner)
        voice_file.unlink(missing_ok=True)

print("Encoding vertical 1080x1920 MP4 clips...")
segments = []
for i, slide in enumerate(slides):
    out = WORK / ("clip_%02d.mp4" % (i + 1))
    filt = (
        "zoompan=z='min(zoom+0.00035,1.05)':"
        "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
        "d=1:s=1080x1920:fps=30,"
        "fade=t=in:st=0:d=0.25,"
        "fade=t=out:st=5.2:d=0.3,"
        "format=yuv420p"
    )
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-loop", "1", "-framerate", "30", "-i", str(slide),
                    "-vf", filt, "-t", str(DURATION),
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
                    "-r", "30", "-an", str(out)], check=True)
    segments.append(out)
concat_file = WORK / "clips.txt"
concat_file.write_text("".join("file '%s'\n" % p.name for p in segments), encoding="utf-8")
joined = WORK / "joined.mp4"
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-f", "concat", "-safe", "0", "-i", str(concat_file),
                "-c", "copy", str(joined)], cwd=WORK, check=False) if False else None
# Input paths are relative to the concat file's directory.
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-f", "concat", "-safe", "0", "-i", str(concat_file),
                "-c", "copy", str(joined)], check=True)
out = OUTPUT / "AracimPro_Reels_27s.mp4"
if voice_file.exists():
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-i", str(joined), "-i", str(WORK / "music.wav"), "-i", str(voice_file),
                    "-filter_complex", "[1:a]volume=0.36[m];[2:a]volume=1.0,adelay=250|250[v];[m][v]amix=inputs=2:duration=first[a]",
                    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac",
                    "-b:a", "160k", "-t", str(TOTAL), "-movflags", "+faststart", str(out)], check=True)
else:
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-i", str(joined), "-i", str(WORK / "music.wav"),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac",
                    "-b:a", "160k", "-t", str(TOTAL), "-movflags", "+faststart", str(out)], check=True)
if out.stat().st_size < 200000:
    raise RuntimeError("Video file too small - refusing publication")
print("SUCCESS", out, out.stat().st_size, "bytes")
