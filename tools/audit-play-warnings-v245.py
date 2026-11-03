#!/usr/bin/env python3
"""Audit real release AAB DEX for the three Google Play Console notices.

Read-only: does not change/sign/upload the bundle. This is a diagnostic, NOT
a Play Console verdict. Conservatively report possible deprecated API sites.
"""
import os
import re
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path

aab = Path("app/build/outputs/bundle/release/app-release.aab")
mapping = Path("app/build/outputs/mapping/release/mapping.txt")
report = Path("app/build/outputs/play-audit-v245/report.txt")
report.parent.mkdir(parents=True, exist_ok=True)
messages = []

def note(message):
    print(message, flush=True)
    messages.append(message)

def persist():
    report.write_text("\n".join(messages) + "\n", encoding="utf-8")

try:
    assert aab.is_file() and aab.stat().st_size > 1000, "Release AAB was not generated"
    assert mapping.is_file() and mapping.stat().st_size > 0, "Release R8 mapping is missing"

    main = Path("app/src/main/java/com/aracimpro/app/MainActivity.java").read_text(encoding="utf-8")
    theme = Path("app/src/main/res/values-v30/styles.xml").read_text(encoding="utf-8")
    gradle = Path("app/build.gradle").read_text(encoding="utf-8")
    assert "LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS" in main, "Missing ALWAYS in Activity"
    assert 'name="android:windowLayoutInDisplayCutoutMode">always' in theme, "Missing ALWAYS theme"
    assert "WindowInsetsCompat.Type.displayCutout()" in main, "Cutout insets missing"
    assert "WindowInsetsCompat.Type.systemBars()" in main, "System bar insets missing"
    assert "WindowInsetsCompat.Type.ime()" in main, "Keyboard insets missing"
    note("1. ANDROID 15/16: Activity ALWAYS / theme ALWAYS / systemBars+cutout+IME insets PRESENT")
    note("   Static checks only; real-device rotation, 3-button, gestures and Play retest required.")

    assert "ads-mobile-sdk:1.6.0" in gradle, "Not migrated to Next-Gen Ads SDK 1.6.0"
    assert "implementation 'com.google.android.gms:play-services-ads:" not in gradle, "Legacy Ads explicitly present"
    assert "module: 'play-services-ads'" in gradle, "Transitive Legacy Ads exclusion missing"
    assert "module: 'play-services-ads-lite'" in gradle, "Transitive Legacy Ads Lite exclusion missing"
    note("2. AD SDK: Next-Gen 1.6.0 configured; Legacy play-services-ads and lite excluded.")

    dexdump = shutil.which("dexdump")
    sdk = Path(os.environ.get("ANDROID_HOME", "/opt/android-sdk"))
    if dexdump is None:
        possible = sorted(sdk.glob("build-tools/*/dexdump"), reverse=True)
        if possible:
            dexdump = str(possible[0])
    assert dexdump, "Android SDK dexdump unavailable; cannot audit DEX"

    dex_paths = []
    with tempfile.TemporaryDirectory(prefix="aracim-v245-") as td:
        with zipfile.ZipFile(aab) as z:
            names = sorted(n for n in z.namelist()
                           if n.startswith("base/dex/") and n.endswith(".dex"))
            assert names, "Release AAB contains no base DEX entries"
            for name in names:
                out = Path(td) / Path(name).name
                out.write_bytes(z.read(name))
                dex_paths.append(out)
        note("   Release dex files inspected: " + str(len(dex_paths)))

        cutout_writes = []
        possible_short_edges = []
        legacy_overlay = []
        for dex in dex_paths:
            # Decode one DEX at a time: never save large dexdump output to the artifact.
            p = subprocess.run([dexdump, "-d", str(dex)],
                               text=True, errors="replace", capture_output=True)
            if p.returncode != 0:
                raise RuntimeError("dexdump failed on " + dex.name +
                                   ": " + p.stderr[-1000:])
            lines = p.stdout.splitlines()
            current_class = ""
            current_method = ""
            for i, line in enumerate(lines):
                m = re.search(r"Class descriptor\s*:\s*'([^']+)'", line)
                if m:
                    current_class = m.group(1)
                m = re.search(r"name\s*:\s*'([^']+)'", line)
                if m:
                    current_method = m.group(1)
                if "com/google/android/gms/ads/internal/overlay" in line:
                    legacy_overlay.append((dex.name, current_class))
                if "layoutInDisplayCutoutMode" not in line:
                    continue
                if not re.search(r"\biput\b|\bsput\b", line):
                    continue
                context = "\n".join(lines[max(0, i-13):i+1])
                item = (dex.name, current_class, current_method)
                cutout_writes.append(item)
                # Android's SHORT_EDGES constant is the integer 1. This scan
                # is intentionally conservative: confirm a found site manually
                # with full method data before claiming the Play notice is solved.
                if re.search(r"(?:const/4|const/16|const)\s+[^,]+,\s*(?:#int\s+)?(?:1\b|0x1\b|\+1\b)", context):
                    possible_short_edges.append((item, context[-1100:]))

        note("   DEX cutoutMode field writes: " + str(len(cutout_writes)))
        note("   DEX sites potentially assigning SHORT_EDGES=1: " + str(len(possible_short_edges)))
        for (dex, cls, method), disasm in possible_short_edges[:25]:
            note("   INVESTIGATE: " + dex + " / " + cls + " / " + method)
            note("   Surrounding DEX instructions:\\n" + disasm)
        note("   Legacy GMA overlay label occurrences: " + str(len(legacy_overlay)))
        # Don't declare the Play deprecated-API notice resolved solely on an
        # absence of signatures; Play uses its own static detector.
        if possible_short_edges:
            note("   API WARNING: deprecated SHORT_EDGES pattern MAY remain. Review before release.")
        else:
            note("   API WARNING: no obvious SHORT_EDGES site found; Play Console retest REQUIRED.")

    yandex_required = {
        "com.admob.mobileads.YandexBanner",
        "com.admob.mobileads.YandexInterstitial",
        "com.admob.mobileads.YandexNative",
        "com.admob.mobileads.YandexRewarded",
    }
    yandex_kept = set()
    mappings = 0
    changed_names = 0
    for line in mapping.open(encoding="utf-8", errors="replace"):
        if not line.endswith(":\n") or " -> " not in line or line.startswith(" "):
            continue
        first, last = line.rstrip()[:-1].split(" -> ", 1)
        mappings += 1
        changed_names += first != last
        if first == last and first in yandex_required:
            yandex_kept.add(first)
    assert yandex_required.issubset(yandex_kept), "Mediation reflection names were changed by R8"
    note("3. R8: mapping present, " + str(mappings) + " mapped classes, " +
         str(changed_names) + " renamed (not Play's optimization percentage).")
    note("   Yandex mediation custom class names: 4/4 preserved.")
    note("   Official Play score only available after uploading a NEW release/internal-test AAB.")
    note("   NO Play Console upload was performed.")
finally:
    persist()
