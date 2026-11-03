#!/usr/bin/env python3
"""Find exact release DEX CALLERS of deprecated SHORT_EDGES=1 helper, not only its
R8-synthesized Glide-looking name. Read-only diagnostic. Never publishes AAB.
"""
import os
import re
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path

aab = Path('app/build/outputs/bundle/release/app-release.aab')
mapping = Path('app/build/outputs/mapping/release/mapping.txt')
output = Path('app/build/outputs/play-audit-v247/deprecated-api-callers.txt')
output.parent.mkdir(parents=True, exist_ok=True)
log = []
def say(t):
    print(t, flush=True)
    log.append(str(t))

sdk = Path(os.environ.get('ANDROID_HOME', '/usr/local/lib/android/sdk'))
dexdump = shutil.which('dexdump')
if not dexdump:
    v = sdk / 'build-tools' / '36.0.0' / 'dexdump'
    dexdump = str(v)
assert Path(dexdump).is_file(), 'Cannot locate dexdump'

rev = {}
for line in mapping.read_text(encoding='utf-8', errors='replace').splitlines():
    if not line.startswith(' ') and line.endswith(':') and ' -> ' in line:
        orig, minified = line[:-1].split(' -> ', 1)
        rev['L' + minified.replace('.', '/') + ';'] = orig

def collect_class_and_method(lines):
    owner, method = '', ''
    for i, line in enumerate(lines):
        x = re.search(r"Class descriptor\s*:\s*'([^']+)'", line)
        if x: owner, method = x.group(1), ''
        x = re.search(r"name\s*:\s*'([^']+)'", line)
        if x: method = x.group(1)
        yield i, owner, method, line

try:
    assert aab.is_file() and mapping.is_file()
    with tempfile.TemporaryDirectory(prefix='aracim-calls-v247-') as td:
        with zipfile.ZipFile(aab) as z:
            names = sorted(x for x in z.namelist() if x.startswith('base/dex/') and x.endswith('.dex'))
            paths = []
            for name in names:
                p = Path(td, Path(name).name)
                p.write_bytes(z.read(name))
                paths.append(p)
        say('Release dex files: ' + str(len(paths)))
        targets = []
        for p in paths:
            proc = subprocess.run([dexdump, '-d', str(p)], capture_output=True, text=True, errors='replace')
            if proc.returncode:
                raise RuntimeError('dexdump failed: ' + proc.stderr[-500:])
            lines = proc.stdout.splitlines()
            for i, owner, method, line in collect_class_and_method(lines):
                if 'layoutInDisplayCutoutMode' not in line or not re.search(r'\biput\b', line):
                    continue
                segment = '\n'.join(lines[max(0, i-12):i+1])
                has_one = bool(re.search(r'const(?:/4|/16)?\s+[^,]+,\s*(?:#int\s+)?1\b', segment))
                say('Field write: ' + p.name + ' ' + owner + '.' + method + ' / original=' + rev.get(owner, 'unmapped') + ' const_ONE=' + str(has_one))
                if has_one:
                    targets.append((owner, method))
                    say('Bytecode:\n' + segment[-850:])

        say('Potential SHORT_EDGES setter wrappers: ' + str(len(targets)))
        callers = []
        for p in paths:
            proc = subprocess.run([dexdump, '-d', str(p)], capture_output=True, text=True, errors='replace')
            if proc.returncode:
                raise RuntimeError('dexdump caller scan failed: ' + proc.stderr[-500:])
            lines = proc.stdout.splitlines()
            for i, owner, method, line in collect_class_and_method(lines):
                if 'invoke-' not in line:
                    continue
                for target_owner, target_method in targets:
                    if target_owner in line and ('.' + target_method + ':') in line:
                        match = (p.name, owner, method, target_owner, target_method)
                        callers.append(match)
                        say('CALLER: dex=' + p.name + ' obfuscated=' + owner + '.' + method +
                            ' originalClass=' + rev.get(owner, 'unmapped') +
                            ' invokes ' + target_owner + '.' + target_method)
                        say('Instruction: ' + line.strip()[:450])
        say('Confirmed wrapper invocation instructions: ' + str(len(callers)))
        if not callers:
            say('No direct invoke found; wrapper may be referenced indirectly or inlined. Do not infer the owning library from synthetic R8 names.')
        say('No Play Console upload or app dependency changes.')
finally:
    output.write_text('\n'.join(log) + '\n', encoding='utf-8')
