#!/usr/bin/env python3
"""Build a publisher-linked, in-app audio catalog. No recording is rehosted in APK."""
import json, os, re, sys, urllib.request, urllib.parse, xml.etree.ElementTree as ET
from urllib.error import URLError, HTTPError
from pathlib import Path

BASE=Path("nur-rehberi/app/src/main/assets")
HEADERS={"User-Agent":"NurRehberi/1.3 (Android Quran audio client; podcast RSS playback)",
         "Accept":"application/rss+xml, application/xml, text/xml, application/json, */*"}
ITUNES_ID="1087814219"
FALLBACK_RSS="https://rss.qurancentral.com/abdurrahmaan-sadien.rss"

def fetch(url, maxbytes=2_000_000, timeout=18, range_header=None):
    h=dict(HEADERS)
    if range_header: h['Range']=range_header
    req=urllib.request.Request(url, headers=h)
    with urllib.request.urlopen(req,timeout=timeout) as resp:
        data=resp.read(maxbytes+1)
        if len(data)>maxbytes: raise ValueError("Response too large")
        return data, resp.headers.get('Content-Type',''),resp.url

feeds=[FALLBACK_RSS]
try:
    raw,_,_=fetch("https://itunes.apple.com/lookup?id="+ITUNES_ID+"&entity=podcast")
    data=json.loads(raw)
    for item in data.get("results",[]):
        url=item.get('feedUrl')
        if url and url.startswith('https://'):
            feeds.insert(0,url)
except Exception as exc:
    print("Apple feed lookup:",str(exc)[:180])

items=[]
feed_used=''
for feed_url in dict.fromkeys(feeds):
    try:
        raw,_,real=fetch(feed_url)
        root=ET.fromstring(raw)
        if root.tag.lower().split('}')[-1]!='rss':raise ValueError("Not RSS")
        channel=root.find('channel')
        if channel is None:raise ValueError('No RSS channel')
        txt=lambda element,p: (element.findtext(p,'') or '').strip()
        title=txt(channel,'title')
        print("RSS title:",title,"URL:",real)
        if "sadien" not in title.casefold():raise ValueError("Wrong reciter, abort")
        feed_used=real
        for ep in channel.findall('item'):
            title=txt(ep,'title')
            enc=ep.find('enclosure')
            if enc is None:continue
            url=(enc.attrib.get('url') or '').replace('&amp;','&')
            if not url.startswith("https://"): continue
            hostname=urllib.parse.urlparse(url).hostname or ''
            if not hostname or hostname.endswith('.local'):continue
            dur=''
            for child in ep:
                if child.tag.lower().split('}')[-1]=='duration':
                    dur=(child.text or '').strip()
            items.append({"id":"sadien-"+str(len(items)+1),"reader":"Abdurrahmaan Sadien",
                "title":title[:140],"url":url,"duration":dur[:24],"source":"Quran Central",
                "site":"https://qurancentral.com/audio/abdurrahmaan-sadien/",
                "published":txt(ep,'pubDate')[:75]})
        break
    except Exception as exc:
        print("RSS read failed:",feed_url,str(exc)[:240])

print("RSS audio enclosures:",len(items))
# Verify actual media starts transferring rather than merely trusting the XML.
usable=[]
for idx,item in enumerate(items):
    try:
        data,ctype,final=fetch(item["url"],maxbytes=1200,timeout=13,range_header='bytes=0-1023')
        sample=data[:24]
        if len(data)<120 and not ctype.lower().startswith('audio/'):raise ValueError("Too small")
        # Some publisher CDNs return application/octet-stream for MP3.
        if ('audio/' not in ctype.lower() and
            'octet-stream' not in ctype.lower() and
            'mpeg' not in ctype.lower() and
            not final.lower().split('?')[0].endswith(('.mp3','.m4a'))):
            raise ValueError("Not an audio stream: "+ctype)
        usable.append(item)
        print('Playable:',title[:35] if False else item['title'][:40],ctype)
    except Exception as exc:
        print("Rejected audio:",item['title'][:50],str(exc)[:100])
    # Checking all items is worthwhile: no nonexistent links published.
print("Verified media links:",len(usable))
if len(usable)<3:
    print("WARNING: Fewer than three Sadien streams passed checks; app won't pretend they are playable.")

catalog={"source":"Quran Central publisher RSS","copyright":"Copyright © Quran Central",
         "note":"Publisher-linked streaming, not copied or stored in APK",
         "updated_by":"GitHub Actions build","readers":[]}
if len(usable)>=3:
    catalog["readers"].append({"id":"sadien","name":"Abdurrahmaan Sadien","style":"Mücevved • Abdülbasit üslubu",
            "country":"Güney Afrika","tracks":usable,"count":len(usable),
            "owner":"Quran Central","site":"https://qurancentral.com/audio/abdurrahmaan-sadien/"})
dest=BASE/"premium_recitations.json"
dest.write_text(json.dumps(catalog,ensure_ascii=False,separators=(',',':')),encoding="utf-8")
print("Wrote:",dest,len(usable),"records",dest.stat().st_size,"bytes")
