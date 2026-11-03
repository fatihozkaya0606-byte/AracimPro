#!/usr/bin/env python3
"""Analyze release R8 mapping, preserving exact Yandex Custom Event entry points.

This is a build diagnostic, NOT a guarantee that Google Play's optimization
percentages will change. Google Play uses its own scoring and reporting.
"""
import os
from pathlib import Path

p = Path("app/build/outputs/mapping/release/mapping.txt")
assert p.exists() and p.stat().st_size > 0, "R8 release mapping missing"

total = retained = 0
groups = {
    "app": ["com.aracimpro.app."],
    "Yandex": ["com.yandex.", "com.admob.mobileads."],
    "Unity": ["com.unity3d."],
    "GoogleMobileAds": ["com.google.android.gms.ads."],
    "AndroidXWork": ["androidx.work."],
    "AndroidXRoom": ["androidx.room."],
}
counts = {k: [0, 0] for k in groups}
yandex_names = set()
obsolete_startio = 0
for line in p.open(encoding="utf-8", errors="replace"):
    if line.startswith(" ") or " -> " not in line or not line.endswith(":\n"):
        continue
    original, renamed = line.rstrip()[:-1].split(" -> ", 1)
    total += 1
    kept = original == renamed
    retained += kept
    if original.startswith(("com.startapp.", "com.truenet.")):
        obsolete_startio += 1
    for group, prefixes in groups.items():
        if original.startswith(tuple(prefixes)):
            counts[group][0] += 1
            counts[group][1] += kept
    if original.startswith("com.admob.mobileads.Yandex") and kept:
        yandex_names.add(original)

required = {
    "com.admob.mobileads.YandexBanner",
    "com.admob.mobileads.YandexInterstitial",
    "com.admob.mobileads.YandexNative",
    "com.admob.mobileads.YandexRewarded",
}
assert required.issubset(yandex_names), (
    "Yandex AdMob Custom Event class names were obfuscated or removed: "
    + str(required - yandex_names)
)
print(f"R8 mapped classes: {total}, kept original names: {retained} "
      f"({retained / max(1, total):.1%}); renamed: {total-retained}")
for k, (n, kept) in counts.items():
    print(f"  {k}: {kept}/{n} names retained")
print(f"Obsolete Start.io classes in output: {obsolete_startio}")
print("Yandex adapter names: all 4 preserved")
os.makedirs("app/build/outputs/r8-report", exist_ok=True)
Path("app/build/outputs/r8-report/summary.txt").write_text(
    f"R8 mapped classes: {total}\n"
    f"Original class names: {retained}\n"
    f"Renamed classes: {total-retained}\n"
    + "\n".join(f"{k}: {kept}/{n} original names"
                  for k, (n, kept) in counts.items()) + "\n"
    + "Yandex adapter class names preserved: yes\n"
    + "Google Play R8 percentages: only confirmed after upload\n",
    encoding="utf-8")
