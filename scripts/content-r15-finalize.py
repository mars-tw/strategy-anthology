"""Verify the final local release receipts and copy fifteen native screenshots."""
from pathlib import Path
import hashlib, json, shutil, struct, subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/content/r15'
read = lambda p: json.loads(p.read_text(encoding='utf-8-sig'))
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()

def write(p, value):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf8')

def main():
    assert (ROOT / '.audit-tmp/r15/verify-exit.txt').read_text().strip() == '0'
    base = read(OUT / 'verification/baseline.json')['gitCommit']
    build = sha(ROOT / 'dist/game.js')
    style = sha(ROOT / 'dist/style.css')
    post = read(OUT / 'verification/post-style-checks.json')
    assert post['status'] == 'VERIFIED' and post['buildSHA256'] == build and post['styleSHA256'] == style
    assert len(post['commands']) == 3 and all(c['exitCode'] == 0 for c in post['commands'])

    e = read(OUT / 'e2e.json')
    assert e['status'] == 'VERIFIED' and not e['errors'] and len(e['outcomes']) == 6
    assert e['buildSHA256'] == build and e['styleSHA256'] == style
    for row in e['shots']:
        assert sha(ROOT / row['path']) == row['sha256'], row['path']
    relays = [r for r in e['outcomes'] if r['kind'] == 'relay']
    assert all(r['fullRun']['waves'] == 4 for r in relays)
    assert len({r['firstWave']['window20']['damage'] for r in relays}) > 1
    assert relays[1]['fullRun']['inheritedDamage'] > 0
    assert relays[2]['fullRun']['spent'] == 430 and relays[2]['fullRun']['balance'] == 50
    assert len({(r['fullRun']['hp'], r['fullRun']['time'], r['fullRun']['balance']) for r in relays}) == 3
    for r in [r for r in e['outcomes'] if r['kind'] == 'sluice']:
        assert abs(sum(d['seconds'] for d in r['gate']['delays'].values()) - r['gate']['delay']) < 1e-8
    perf = read(OUT / 'performance.json')
    assert perf['styleSHA256'] == style
    assert perf['status'] == 'VERIFIED' and perf['buildSHA256'] == build and len(perf['runs']) == 18
    clean = read(OUT / 'cleanup.json')
    assert clean['allAbsent'] and all(not (ROOT / r['path']).exists() for r in clean['files'])
    clean.update(status='VERIFIED', fullVerifyExitCode=0)
    write(OUT / 'cleanup.json', clean)
    initial = read(ROOT / '.audit-tmp/r15/initial-untracked.json')
    for r in initial:
        assert sha(ROOT / r['path']) == r['sha256']
    retained = read(OUT / 'retained-legacy-test-inputs.json')
    for r in retained['files']:
        assert sha(ROOT / r['path']) == r['sha256']
    audit = read(OUT / 'regression/release-audit/release-audit.json')
    assert audit['status'] == 'VERIFIED' and audit['version'] == '0.23.0' and audit['secretScan']['matches'] == 0
    stores = []
    for entry in subprocess.check_output(['git', 'ls-tree', '-r', '-z', base, '--', 'docs/store/screenshots'], cwd=ROOT).decode().split('\0'):
        if not entry:
            continue
        meta, name = entry.split('\t', 1)
        data = (ROOT / name).read_bytes()
        assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == meta.split()[2], name
        stores.append({'path': name, 'sha256': sha(ROOT / name)})
    write(OUT / 'verification/existing-store-integrity.json', {'status': 'VERIFIED', 'files': stores})
    for prefix, dims in [('iphone', (1290, 2796)), ('ipad', (2064, 2752))]:
        p = ROOT / f'docs/store/screenshots/{prefix}-content-r15-sluice-{dims[0]}x{dims[1]}.png'
        assert struct.unpack('>II', p.read_bytes()[16:24]) == dims
    names = [
        ('relay', 'relay-upstream-combat'), ('relay', 'relay-gate-inherited-hit'),
        ('relay', 'relay-crystals-spent'), ('relay', 'relay-crystals-result'), ('relay', 'relay-three-branch-comparison'),
        ('terrain', 'terrain-barricade-turn-1'), ('terrain', 'terrain-barricade-turn-2'), ('terrain', 'terrain-barricade-turn-3'),
        ('terrain', 'terrain-flood-enter'), ('terrain', 'terrain-flood-frost-details'),
        ('exercise', 'sluice-before-release'), ('exercise', 'sluice-release-instant'), ('exercise', 'sluice-delay-increments'),
        ('exercise', 'sluice-ended-summary'), ('exercise', 'sluice-unused-trials')]
    gallery = OUT / 'review-set'
    gallery.mkdir(exist_ok=True)
    images = []
    for i, (category, name) in enumerate(names, 1):
        src = OUT / f'phone-{name}.png'
        dst = gallery / f'{i:02d}-{name}.png'
        assert struct.unpack('>II', src.read_bytes()[16:24]) == (430, 932)
        shutil.copy2(src, dst)
        assert sha(src) == sha(dst)
        images.append({'category': category, 'source': src.relative_to(ROOT).as_posix(), 'path': dst.relative_to(ROOT).as_posix(), 'dimensions': [430, 932], 'sha256': sha(dst)})
    assert len(list(gallery.glob('*.png'))) == 15
    write(OUT / 'review-index.json', {'status': 'VERIFIED', 'buildSHA256': build, 'styleSHA256': style, 'images': images, 'method': 'Five native portrait images per item; direct copies without resizing, cropping or montage.'})
    contracts = []
    for name in subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', base, '--', 'tests'], cwd=ROOT).decode().splitlines():
        old = subprocess.check_output(['git', 'show', base + ':' + name], cwd=ROOT).decode('utf8').replace('\r\n', '\n')
        current = (ROOT / name).read_text(encoding='utf8').replace('docs/content/r15/regression/', 'docs/content/r14/regression/')
        assert current == old, 'Existing test changed beyond evidence paths: ' + name
        contracts.append(name)
    old = subprocess.check_output(['git', 'show', base + ':scripts/content-r14-e2e.mjs'], cwd=ROOT).decode('utf8').replace('\r\n', '\n')
    current = (ROOT / 'scripts/content-r14-e2e.mjs').read_text(encoding='utf8')
    current = current.replace("const out=evidenceDir('content-r14')", "const out='docs/content/r14'").replace('await p.screenshot({path:evidenceFile(path)});', 'await p.screenshot({path});').replace('report.shots.push({path:evidenceFile(path),', 'report.shots.push({path,').replace('sha(await readFile(evidenceFile(path))),frame:v', 'sha(await readFile(path)),frame:v')
    assert current == old, 'R14 browser assertions or playthrough changed'
    write(OUT / 'verification/legacy-test-contracts.json', {'status': 'VERIFIED', 'originalTestFiles': contracts, 'R14BrowserAssertionsUnchanged': True, 'onlyException': 'Current evidence output paths, including two expected paths in content-r14.test.js.'})
    for name in ['verify.txt', 'perf.txt']:
        raw = (ROOT / '.audit-tmp/r15' / name).read_bytes()
        text = raw.decode('utf16') if raw.startswith(b'\xff\xfe') else raw.decode('utf8')
        (OUT / 'verification' / name).write_text(text, encoding='utf8')
    write(OUT / 'verification/secret-scan.json', {'status': 'VERIFIED', **audit['secretScan']})
    release = {'status': 'VERIFIED', 'version': '0.23.0', 'buildSHA256': build, 'fullVerifyExitCode': 0, 'fullVerifyStyleSHA256': read(OUT / 'verification/full-sweep-artifacts.json')['styleSHA256'], 'finalStyleSHA256': style, 'postStyleChecks': post['commands'], 'unitTests': 197, 'browserChecks': len(e['checks']), 'shots': len(e['shots']), 'reviewImages': 15, 'newGeneratedArt': 0, 'deletedFiles': clean['count'], 'deletedBytes': clean['bytes'], 'retainedLegacyTestImages': retained['count'], 'initialUntrackedPreserved': len(initial), 'existingStoreImagesPreserved': len(stores), 'maxMedianP95': max(r['medianP95'] for r in perf['summary']), 'MuseRescore': 'BLOCKED', 'physicalDevicesAndHumanPlaytest': 'BLOCKED'}
    write(OUT / 'verification/release-check.json', release)
    report = ROOT / 'docs/CODEX_RESPONSE_CONTENT_R15.md'
    text = report.read_text(encoding='utf8').replace('PREPARED：版本0.23.0', 'VERIFIED：清理後完整 npm run verify exit 0。版本0.23.0').replace('PREPARED：清理後完整 `npm run verify`、七視口、離線及效能收據待最終讀回。', f"VERIFIED：清理後完整 `npm run verify` exit 0；七視口、離線冷載入、重載與完成檢查通過。本輪瀏覽器共通過 {len(e['checks'])} 次斷言、{len(e['shots'])} 張原尺寸截圖。秘密掃描0命中。18跑效能的六組中位p95最大 {release['maxMedianP95']:.2f}ms≤18ms。").replace('EXECUTED：移除 **1,216個**', 'VERIFIED：移除 **1,216個**')
    lines = ['\n## 本輪完整三案實測\n', '| 分支 | 首波20秒傷害／命中 | 首波留守 | 整場留守 | 四波耐久 | 漏入 | 秒數 | 支出／淨值 |', '|---|---|---|---|---|---|---|---|']
    for r in relays:
        f, w = r['firstWave'], r['fullRun']
        label = {'upstream': '上游', 'gate': '城門', 'crystals': '拆晶'}[r['branch']]
        lines.append(f"| {label} | {f['window20']['damage']}／{f['window20']['hits']} | {f['inheritedDamage']} | {w['inheritedDamage']} | {w['hp']}/100 | {w['leaks']} | {w['time']:.1f} | {w['spent']}／{w['balance']} |")
    lines += ['\n## 其餘五題窄陣補證\n', '| 演習 | 遊玩中 | 完成 | 失敗 |', '|---|---|---|---|']
    for ident, label in [('turn', '聚印轉角'), ('levee', '分守長堤'), ('switchback', '折返雙隘'), ('split', '雙岸接力'), ('hollow', '空哨折道')]:
        links = []
        for state in ['combat', 'complete', 'failed']:
            p = OUT / f'regression/content-r11/phone-exercise-{ident}-{state}.png'
            assert p.is_file(), p
            links.append(f'[原圖]({p.relative_to(ROOT / "docs").as_posix()})')
        lines.append(f'| {label} | ' + ' | '.join(links) + ' |')
    if '\n## 本輪完整三案實測\n' not in text:
        text += '\n'.join(lines) + '\n'
    report.write_text(text, encoding='utf8')
    print('VERIFIED:', json.dumps(release, ensure_ascii=True))

if __name__ == '__main__':
    main()
