#!/usr/bin/env python3
"""Curate authentic MP3Quran reciters who have recordings on an authoritative source.
Names and available surahs come directly from API metadata; audio URLs are probed.
This file does not copy music or recordings into the app.
"""
from pathlib import Path
from urllib.request import Request, urlopen
import concurrent.futures,json,re,unicodedata
root=Path("nur-rehberi/app/src/main/assets")
catalog=json.loads((root/"reciters.json").read_text(encoding='utf-8'))
def normalize(s):
    s=str(s or '').casefold().replace('ı','i').replace('ş','s').replace('ğ','g')
    s=''.join(ch for ch in unicodedata.normalize('NFKD',s) if not unicodedata.combining(ch))
    return re.sub(r'[^a-z0-9]','',s)
# These are search fragments; final identity comes ONLY from returned API reader metadata.
priorities=[
 ("Abdülbasit Abdüssamed", ["abdulbasit","abdulbaset","abdulbasit","basitabdulsamad"],"Mücevved • makamlı"),
 ("Mustafa İsmail",["mustafaismail"],"Makamlı klasik"),
 ("Muhammed Sıddık el-Minşâvî",["minshawi","menshawi","minsavi","minsaw"],"Duygulu mücevved"),
 ("Muhammed Tablavî",["tablaway","tablawi","tablavi"],"Güçlü klasik Mısır"),
 ("Ahmed Nuayna",["nauina","nuaina","noina"],"Makamlı"),
 ("Mahmud Ali el-Bennâ",["albanna","albana"],"Klasik"),
 ("Muhammed Rıfat",["refat","riffat","rifat"],"Tarihî"),
 ("Mahmud Halil el-Husarî",["hussary","husary","hussari","husari"],"Tecvidli"),
 ("Muammer ZA",["muamar","muammar"],"Endonezya • makamlı"),
 ("Ebu Bekir eş-Şâtırî",["shatri","shatry","satri"],"Dengeli tilavet"),
 ("Şaban es-Sayyâd",["shabanalsayiaad","shabanalsayaad","shabanalsayyad"],"Makamlı kıraat"),
 ("Abdurrahman eş-Şehhât",["abdulrahmanalshahhat","abdulrahmanalshahat"],"Güçlü makam"),
 ("Ahmed el-Acemî",["ahmadalajmy","ahmedalajmy","alajmy","alajmi"],"Etkileyici"),
 ("Mişârî Râşid el-Afâsî",["misharyalafasi","misharialafasi","alafasi"],"Duygulu"),
 ("Maher el-Muaykılî",["maheralmeaqli","maheralmuaiqly","meaqli","muaiqly"],"Akıcı"),
 ("Yasir ed-Dosarî",["yasseral-dosari","yasseral-dossari","yasseraldo"],"Etkileyici"),
 ("Nasır el-Katamî",["nasseralqatami","nasseralkatami","nasseralqatamy"],"Duygulu"),
 ("Fâris Abbâd",["faresabbad","farisabbad"],"Derin ses"),
 ("İdris Ebker",["idreesabkr","idrisabkr","idreesabkar"],"Duygulu"),
 ("Nureyn Muhammed Sıddık",["noreenmohammadsiddiq","noreenmuhammadsiddiq","noreen"],"Sudan • etkileyici"),
 ("Hasan Salih",["hasansaleh","hassansaleh"],"Duygulu"),
 ("Abdullah Kâmil",["abdullahkamil","abdullahkamel"],"Makamlı"),
 ("Ömer el-Kazabrî",["omaralqazabri","omaralkazabri","qazabri"],"Fas • makamlı"),
 ("Hâlid el-Celîl",["khalidaljileel","khalidaljalil","aljileel"],"Duygulu"),
 ("Hazzâ el-Belûşî",["hazzaalbalushi","hazzaalbaloushi","hazza"],"Etkileyici"),
 ("Abdurrahman es-Südeys",["abdulrahmanalsudaes","abdulrahmanalsudais","alsudais","alsudaes"],"Mekke imamı"),
 ("Suud eş-Şureym",["saudalshuraim","saudashshuraim","alshuraim"],"Mekke imamı"),
 ("Muhammed Eyyûb",["mohammedayyub","mohammadayyub"],"Medine kıraati"),
 ("Tevfik es-Sâiğ",["tawfeeqassayegh","tawfeeqalsayegh","alsayegh"],"Duygulu"),
 ("Ali el-Huzeyfî",["alialhuthaifi","alialhuthaify","huthaifi"],"Medine imamı"),
 ("Ali Câbir",["alijaber","alijabir"],"Huzurlu kıraat"),
 ("Ahmed en-Nefîs",["ahmedelnefis","ahmedalnafis","elnefis"],"Makamlı"),
 ("İslam Subhî",["islamsubhi","islamsobhi"],"Genç kârî"),
 ("Şeyh Zekeriyyâ Hamâme",["zakariahamamah","zakariyahamamah"],"Makamlı"),
 ("Sâd el-Gâmidî",["saadalghamdi","saadalgamidi","saadalgamdi"],"Akıcı"),
 ("Yahya Havvâ",["yahyahawwa","yahyahawa"],"Duygulu"),
 ("Hazım es-Sâlîmî",["mansurassalimi","mansurelsalimi","mansuralsalimi"],"Güçlü"),
 ("Eymen Rüşdî Süveyd",["aymanrushdisuwaid","aymanrushdisuwaid","aymanrushdi"],"Tecvid"),
 ("Abdülkadir el-Kürdî",["raadalkurdi","raadalkurdy"],"Duygulu"),
 ("Salah el-Budeyr",["salahalbudair","salahalbudayr","salahalbudair"],"Mekke/Medine kıraati"),
 ("Bender Belîle",["bandarbalilah","bandarbalila"],"Mekke imamı"),
]
used=set()
candidate=[]
for name,fragments,style in priorities:
    found=[r for r in catalog if r.get('id') not in used and r.get('available')
           and any(p in normalize(r.get('name','')) for p in fragments)]
    if not found:
        print("NOT FOUND:",name)
        continue
    # prefer highly complete recordings, then explicitly labelled mujawwad if desired
    found.sort(key=lambda r:(len(r['available']),("mujaw" in normalize(r.get('moshaf','')))),reverse=True)
    r=found[0];used.add(r['id'])
    candidate.append({"id":r["id"],"name":name,"original":r["name"],"style":style,
      "moshaf":r.get("moshaf",""),"server":r['server'],"available":r['available'],"count":len(r['available'])})
print("Curated matches:",len(candidate))
def probe(x):
    nums=x['available']
    picks=[n for n in [1,36,55,67,78,112] if n in nums]
    if not picks:picks=nums[:1]
    for n in picks[:2]:
        url=x['server']+str(n).zfill(3)+'.mp3'
        try:
            req=Request(url,headers={"User-Agent":"Mozilla/5.0 (NurRehberi/1.6)","Range":"bytes=0-2047","Accept":"audio/mpeg,*/*"})
            with urlopen(req,timeout=16) as resp:
                buf=resp.read(2048)
                mime=resp.headers.get("Content-Type","")
                good=(resp.status in (200,206) and len(buf)>=128 and
                   ("audio/" in mime or "octet-stream" in mime or buf.startswith(b"ID3") or
                    buf[:2] in (bytes([0xff,0xfb]),bytes([0xff,0xf3]))))
            if good:return x,True,n,mime
        except Exception as exc:
            print("Failed sample:",x['name'],n,str(exc)[:120])
    return x,False,None,'no successful sample'
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
    results=list(pool.map(probe,candidate))
verified=[]
for item,good,n,mime in results:
    print("OK" if good else "NO",item['name'],item['id'],item['count'],'sample',n,mime)
    if good:
        item['checked_surah']=n
        verified.append(item)
out={"source":"MP3Quran API v3; verify at build","note":"Recordings are streamed from MP3Quran, not rehosted","readers":verified}
(root/'featured_reciters.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print("Verified curated reciters:",len(verified),"out of",len(candidate))
if len(verified)<18:raise SystemExit("Not enough verified curated readers; do not publish empty catalog")
