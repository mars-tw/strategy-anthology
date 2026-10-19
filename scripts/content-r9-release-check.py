"""Read-only R9 delivery gate: original screenshots, actual test receipts, release identity."""
from pathlib import Path
import hashlib
import json
import struct

root = Path(__file__).resolve().parents[1]
out = root / 'docs/content/r9'
read = lambda p: json.loads(p.read_text(encoding='utf-8-sig'))
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
checks = []

def check(name, condition):
    if not condition:
        raise AssertionError(name)
    checks.append(name)

def size(p):
    data = p.read_bytes()
    check(p.name + ' is PNG', data[:8] == b'\x89PNG\r\n\x1a\n')
    return struct.unpack('>II', data[16:24])

version = read(root / 'package.json')['version']
check('release version is 0.17.0', version == '0.17.0')
for name in ['src/campaign.js', 'src/version.js', 'package-lock.json', 'README.md']:
    text = (root / name).read_text(encoding='utf-8')
    check(name + ' release identity', '0.17.0' in text and '0.16.0' not in text)
build = sha(root / 'dist/game.js')
for name in ['e2e.json', 'proof-e2e.json']:
    result = read(out / name)
    check(name + ' actually verified this build', result['status'] == 'VERIFIED' and result['buildSHA256'] == build and not result['errors'])
    check(name + ' has checks and original screenshots', bool(result['checks']) and bool(result['shots']))
    for shot in result['shots']:
        check(shot['path'] + ' hash unchanged', sha(root / shot['path']) == shot['sha256'])
manifest = read(out / 'review-set-manifest.json')
check('exactly 15 original phone screenshots', len(manifest['images']) == 15 and len(list((out / 'review-set').iterdir())) == 15)
for category in ['relay', 'terrain', 'exercise']:
    check(category + ' has exactly five review images', sum(r['category'] == category for r in manifest['images']) == 5)
for row in manifest['images']:
    source, target = root / row['source'], root / row['path']
    check(target.name + ' is a byte-identical original', sha(source) == sha(target) == row['sha256'])
    check(target.name + ' is native phone portrait', size(target) == (430, 932))
for name, dimensions in [('iphone-content-r9-flood-1290x2796.png', (1290, 2796)), ('ipad-content-r9-flood-2064x2752.png', (2064, 2752))]:
    check(name + ' store dimensions', size(root / 'docs/store/screenshots' / name) == dimensions)
verification = read(out / 'verification/verification.json')
check('npm run verify exit 0', verification['verifyExitCode'] == 0 and verification['buildSHA256'] == build)
for name in ['verify', 'proof', 'perf']:
    log = out / 'verification' / (name + '.txt')
    check(name + ' execution output retained', log.is_file() and 'VERIFIED' in log.read_text(encoding='utf-8'))
restored = read(out / 'verification/historical-readback.json')
check('all historical tracked artifacts restored', restored['status'] == 'VERIFIED' and restored['changed'] == [])
scan = read(out / 'verification/secret-scan.json')
check('zero secret matches', scan['matches'] == 0)
result = {'status': 'VERIFIED', 'version': version, 'buildSHA256': build, 'checks': checks}
(out / 'verification/release-check.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'VERIFIED: {len(checks)} delivery checks; 15 byte-identical phone originals.')
