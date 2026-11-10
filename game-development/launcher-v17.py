#!/usr/bin/env python3
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import sys, math
root=Path(sys.argv[1])
res=root/'app'/'src'/'main'/'res'
S=512
base=Image.new('RGBA',(S,S),(0,0,0,0))
px=base.load()
for y in range(S):
 for x in range(S):
  t=(x+y)/1024
  px[x,y]=(int(16+17*t),int(41+26*t),int(103+42*t),255)
draw=ImageDraw.Draw(base)
# Deep blue panel, decorative path arrows, colorful arrow puzzle blocks
for x,y,r,fill in [(76,74,72,(28,183,253,255)),(255,64,77,(255,203,65,255)),(405,95,68,(96,230,139,255))]:
 draw.ellipse((x-r,y-r,x+r,y+r),fill=fill)
# Subtle dynamic rings
for k in (0,1,2):
 draw.arc((10+k*14,10+k*14,502-k*14,502-k*14),190,346,fill=(120,180,235,75),width=4)
def poly(points,color,shadow=True):
 if shadow:draw.polygon([(x+5,y+7) for x,y in points],fill=(3,15,44,185))
 draw.polygon(points,fill=color)
def block(x,y,size,c1,c2,symbol):
 shadow=Image.new('RGBA',(S,S),(0,0,0,0));sd=ImageDraw.Draw(shadow)
 sd.rounded_rectangle((x+8,y+12,x+size+8,y+size+12),radius=24,fill=(0,0,0,135))
 shadow=shadow.filter(ImageFilter.GaussianBlur(12));base.alpha_composite(shadow)
 d=ImageDraw.Draw(base)
 d.rounded_rectangle((x,y,x+size,y+size),radius=24,fill=c1,outline=(255,255,255,135),width=3)
 d.polygon([(x+6,y+7),(x+size-5,y+7),(x+size-27,y+25),(x+22,y+25)],fill=(255,255,255,78))
 d.polygon([(x+size-22,y+27),(x+size-7,y+8),(x+size-7,y+size-10),(x+size-22,y+size-2)],fill=c2)
 try:font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',size//2)
 except:font=ImageFont.load_default()
 bb=d.textbbox((0,0),symbol,font=font)
 tx=x+(size-(bb[2]-bb[0]))/2
 ty=y+(size-(bb[3]-bb[1]))/2-bb[1]
 d.text((tx+1,ty+2),symbol,font=font,fill=(0,0,0,65))
 d.text((tx,ty),symbol,font=font,fill='white')
block(52,98,133,(21,154,238,255),(16,79,194,255),'→')
block(204,67,132,(255,184,28,255),(232,107,0,255),'↑')
block(352,112,110,(73,220,109,255),(8,143,86,255),'↘')
# Visible game logo
d=ImageDraw.Draw(base)
fontpath='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
big=ImageFont.truetype(fontpath,93)
small=ImageFont.truetype(fontpath,69)
def center(text,y,font,fill,stroke=3):
 bb=d.textbbox((0,0),text,font=font,stroke_width=stroke)
 x=(S-(bb[2]-bb[0]))/2-bb[0]
 d.text((x+3,y+5),text,font=font,fill=(2,18,51),stroke_width=stroke,stroke_fill=(2,18,51))
 d.text((x,y),text,font=font,fill=fill,stroke_width=stroke,stroke_fill=(22,62,113))
center('OK',286,big,(255,244,185),3)
center('KAÇIŞ',389,small,(255,255,255),2)
d.rounded_rectangle((115,486,397,492),radius=3,fill=(239,204,83))
out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
base.save(out/'OkKacis_GooglePlay_512.png',optimize=True)
# Android launcher icons use exact same full artwork as the store icon.
for density,size in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
 loc=res/('mipmap-'+density);loc.mkdir(parents=True,exist_ok=True)
 source=base.resize((size,size),Image.Resampling.LANCZOS)
 source.save(loc/'ic_launcher.png',optimize=True)
 # Circular rendering of same artwork for devices requesting round launcher icons.
 mask=Image.new('L',(size,size));md=ImageDraw.Draw(mask);md.ellipse((0,0,size-1,size-1),fill=255)
 circ=source.copy();circ.putalpha(mask);circ.save(loc/'ic_launcher_round.png',optimize=True)
print('Generated Play and Android icon PNG files')
