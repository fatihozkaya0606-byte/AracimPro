import math, random
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

rng=np.random.default_rng(1942)
w,h=720,1020
Y,X=np.mgrid[0:h,0:w]
noise=np.zeros((h,w), dtype=float)
for sigma,weight in [(90,.28),(42,.25),(18,.21),(7,.16),(2,.10)]:
    a=gaussian_filter(rng.standard_normal((h,w)),sigma=sigma,mode="reflect")
    a=(a-a.mean())/(a.std()+1e-8)
    noise+=a*weight
ridge=400+.28*(X-330)+55*np.sin(X/115)+30*np.sin(X/49)
mountain=np.exp(-((Y-ridge)/120)**2)*.84
other=np.exp(-((Y-(800+100*np.sin(X/95)))/120)**2)*.43
alt=np.clip(.27+noise*.10+mountain+other,0,1.3)
dy,dx=np.gradient(gaussian_filter(alt,1.5))
light=np.clip(.78+3.2*(-dx-dy),.42,1.34)
levels=[0,.18,.34,.47,.57,.68,.79,1]
colors=[[39,74,53],[85,110,69],[108,120,75],[143,129,88],[146,138,121],[176,177,165],[211,210,199],[237,236,221]]
color=np.empty((h,w,3))
for k in range(3):
    color[:,:,k]=np.interp(alt,levels,[p[k] for p in colors])
color*=light[:,:,None]
color+=rng.normal(0,5.3,(h,w,1))
color[:,:,0]*=1.06;color[:,:,1]*=1.02;color[:,:,2]*=.94
coast=40+95*np.exp(-((Y-290)/260)**2)+15*np.sin(Y/51)
sea=(X<coast)&(Y<655)
water=np.zeros_like(color)
water[:,:,0]=24;water[:,:,1]=64;water[:,:,2]=78
n=gaussian_filter(rng.random((h,w)),3)
water+=((n-.5)*75)[:,:,None]
color=np.where(sea[:,:,None],water,color)
vign=np.clip(.96-.13*((X/w-.5)**2+(Y/h-.5)**2),.76,1)
color*=vign[:,:,None]
im=Image.fromarray(np.uint8(np.clip(color,0,255)),"RGB").convert("RGBA")
draw=ImageDraw.Draw(im,"RGBA")
random.seed(141)
for i in range(19000):
    x=random.randrange(w);y=random.randrange(h)
    if not sea[y,x] and .16<alt[y,x]<.47 and rng.random()<.68:
        r=1 if random.random()<.86 else 2
        draw.ellipse((x-r,y-r,x+r,y+r),fill=(17,53,39,random.randrange(14,46)))
for i in range(10000):
    x=random.randrange(w);y=random.randrange(h)
    if not sea[y,x] and alt[y,x]>.65:
        sz=random.choice([1,1,2,3]);draw.line((x,y,x+sz,y-sz),fill=(237,238,222,random.randrange(28,71)))
rivers=[[(560,210),(543,290),(511,400),(490,478),(462,564),(424,700),(405,850),(397,1010)],[(300,270),(330,342),(333,455),(285,550),(300,690),(270,790),(230,930)],[(685,320),(648,419),(611,500),(610,650),(590,780),(567,918)]]
for river in rivers:
    pts=[]
    for (x1,y1),(x2,y2) in zip(river,river[1:]):
        for j in range(28):
            t=j/28; yy=y1+(y2-y1)*t
            xx=x1+(x2-x1)*t+5*math.sin(yy/19)+4*math.sin(yy/37)
            pts.append((xx,yy))
    draw.line(pts,fill=(23,60,77,160),width=7)
    draw.line(pts,fill=(73,139,151,198),width=3)
roads=[[(84,600),(243,653),(395,490),(490,345),(555,197)],[(240,653),(425,585),(555,493),(610,610)],[(84,600),(180,455),(326,430),(490,345)],[(240,653),(450,862),(590,890)],[(395,490),(425,585),(610,610)],[(555,197),(633,410),(555,493)]]
for pts in roads:
    draw.line(pts,fill=(42,30,17,155),width=7)
    draw.line(pts,fill=(226,196,131,170),width=3)
rail=[(84,600),(245,653),(394,492),(550,494),(610,610)]
draw.line(rail,fill=(47,40,30,200),width=6)
draw.line(rail,fill=(214,203,168,160),width=2)
im.convert("RGB").save("cephe-komutani/app/src/main/assets/terrain.webp","WEBP",quality=89,method=6)
print("Created offline terrain texture 720x1020")
