#!/usr/bin/env python3
"""Diagnose kept R8 names, no changes to production code or SDKs."""
from pathlib import Path
from collections import Counter, defaultdict
import zipfile,json,re
aab = Path("app/build/outputs/bundle/release/app-release.aab")
mapping = Path("app/build/outputs/mapping/release/mapping.txt")
out=Path("out/r8-diagnostics")
out.mkdir(parents=True,exist_ok=True)
assert aab.is_file() and mapping.is_file()
with zipfile.ZipFile(aab) as z:
    meta=json.loads(z.read("BUNDLE-METADATA/com.android.tools/r8.json"))
stats=meta["stats"]
obf=100-stats["noObfuscationPercentage"]
print(f"PLAY-METRIC: obfuscation {obf:.2f}% shrinking {100-stats['noShrinkingPercentage']:.2f}% optimization {100-stats['noOptimizationPercentage']:.2f}%")
rows=[]
keepers=Counter()
renamed=Counter()
examples=defaultdict(list)
member_kept=Counter()
member_total=Counter()
group="unknown"
for raw in mapping.open(errors="replace"):
    if raw and not raw.startswith(" ") and raw.rstrip().endswith(":") and " -> " in raw:
        src,dst=raw.strip()[:-1].split(" -> ",1)
        pkg=".".join(src.split(".")[:3])
        group=pkg
        rows.append((src,dst,pkg))
        if src==dst:
            keepers[pkg]+=1
            if len(examples[pkg])<12:examples[pkg].append(src)
        else: renamed[pkg]+=1
    elif raw.startswith(" ") and " -> " in raw and group:
        member_total[group]+=1
        # a typical member mapping is 1:5:void getFoo() -> a; class fields don't have line no.
        name=raw.rsplit(" -> ",1)[-1].strip()
        orig=raw.split(" -> ",1)[0].strip()
        left=orig.rsplit("(",1)[0].split(" ")[-1].split(".")[-1]
        if name==left: member_kept[group]+=1
report=["R8 actual r8.json stats:",json.dumps(stats,indent=2),"Total mapped classes: "+str(len(rows)),"",
"TOP PACKAGES BY KEPT CLASS NAMES (not necessarily root cause):"]
for pkg,c in keepers.most_common(100):
    report.append(f"{pkg}: original={c}, renamed={renamed[pkg]}, kept_members={member_kept[pkg]}/{member_total[pkg]} ex={', '.join(examples[pkg][:4])}")
report+=["","TOP PACKAGES BY UNOBFUSCATED MEMBER NAMES:"]
for pkg,c in member_kept.most_common(100):
    report.append(f"{pkg}: {c}/{member_total[pkg]} member names kept, original classes={keepers[pkg]}")
out.joinpath("r8-summary.txt").write_text("\n".join(report)+"\n")
out.joinpath("r8.json").write_text(json.dumps(meta,indent=2))
config=Path("app/build/outputs/mapping/release/configuration.txt")
if config.exists():
    out.joinpath("configuration.txt").write_bytes(config.read_bytes())
    lines=config.read_text(errors="replace").splitlines()
    broad=[line.strip() for line in lines if re.search(r'^-keep\S*\s+(class|interface)\s+(\*|\*\*|[\w.]+\.\*\*)',line.strip())]
    out.joinpath("broad-rules.txt").write_text("\n".join(broad)+"\n")
    print("BROAD-KEEP-RULES: "+str(len(broad)))
    print("\n".join(broad[:40]))
print("\n".join(report[:45]))
