import json, os, gzip, re, urllib.request, sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# refresh build metadata
os.system('cd /d "c:\\Users\\dgknb\\Desktop\\Proje\\Mobil\\aislam-mobile" && npx eas-cli build:view 2c017e7b-cba1-4233-b99b-44857f5470c2 --json > "%TEMP%\\eas-build2.json" 2>nul')

build_json = os.path.join(os.environ['TEMP'], 'eas-build2.json')
for enc in ('utf-16', 'utf-8-sig', 'utf-8'):
    try:
        raw = open(build_json, encoding=enc).read()
        d = json.loads(raw[raw.find('{'):])
        break
    except Exception as e:
        last = e
        d = None
else:
    raise SystemExit(f'json parse fail: {last}')

print('status', d.get('status'))
print('error', d.get('error'))
url = (d.get('logFiles') or [None])[0]
if not url:
    raise SystemExit('no log url')

path = os.path.join(os.environ['TEMP'], 'easlog2.bin')
urllib.request.urlretrieve(url, path)
data = open(path, 'rb').read()
print('bytes', len(data), 'magic', data[:8])

# try gzip / plain / brotli-ish
text = None
if data[:2] == b'\x1f\x8b':
    text = gzip.decompress(data).decode('utf-8', 'replace')
else:
    try:
        text = data.decode('utf-8')
    except Exception:
        text = data.decode('utf-8', 'replace')

out = os.path.join(os.environ['TEMP'], 'easlog2.txt')
open(out, 'w', encoding='utf-8').write(text)
keys = re.compile(r'FAILED|Unresolved|AgeRestricted|metadata is|What went wrong|BUILD FAILED|e: file://|Execution failed|error:|Kotlin', re.I)
hits = [ln for ln in text.splitlines() if keys.search(ln)]
print('hits', len(hits))
for ln in hits[-50:]:
    print(ln)
if not hits:
    print('--- tail ---')
    print('\n'.join(text.splitlines()[-40:]))
