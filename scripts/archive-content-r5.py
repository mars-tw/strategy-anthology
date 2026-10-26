"""Retain this run's legacy check output, then restore initially clean historical evidence.

Requires the local preflight byte snapshot. Never touches initial untracked files.
No deletion; every replaced file is hash-verified inside an archive first.
"""
import hashlib
import json
from pathlib import Path
import zipfile
import subprocess

root = Path(__file__).resolve().parent.parent
state = json.loads((root / '.audit-tmp/content-r5/initial.json').read_text(encoding='utf-8'))
baseline = root / '.audit-tmp/content-r5/baseline'
out = root / 'docs/content/r5/verification-artifacts'
out.mkdir(parents=True, exist_ok=True)
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
changed = []
for name, original_hash in state['tracked'].items():
    p = root / name
    if not name.startswith('docs/') or not p.is_file() or digest(p) == original_hash:
        continue
    # Intentional source documentation is part of this release, not generated evidence.
    if name == 'docs/store/SCREENSHOTS.md':
        continue
    old = baseline / name
    assert old.is_file() and digest(old) == original_hash, f'Preflight snapshot mismatch: {name}'
    changed.append((name, p.stat().st_size, digest(p), original_hash))

receipt = {'status': 'EXECUTED', 'sourceHead': state['head'], 'files': [], 'archives': []}
chunks, current, total = [], [], 0
for item in changed:
    if total > 28_000_000:
        chunks.append(current)
        current, total = [], 0
    current.append(item)
    total += item[1]
if current:
    chunks.append(current)
for index, chunk in enumerate(chunks, 1):
    archive = out / f'legacy-verification-{index}.zip'
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for name, *_ in chunk:
            z.write(root / name, name)
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        for name, size, new_hash, old_hash in chunk:
            assert hashlib.sha256(z.read(name)).hexdigest() == new_hash
            receipt['files'].append({'path': name, 'bytes': size, 'runSHA256': new_hash,
                                     'restoredSHA256': old_hash, 'archive': archive.relative_to(root).as_posix()})
    receipt['archives'].append({'path': archive.relative_to(root).as_posix(), 'bytes': archive.stat().st_size,
                                'sha256': digest(archive)})
for name, _, _, old_hash in changed:
    (root / name).write_bytes((baseline / name).read_bytes())
    assert digest(root / name) == old_hash
for name, original_hash in state['untracked'].items():
    assert digest(root / name) == original_hash, f'Initial untracked file changed: {name}'
new_movies = [name for name in subprocess.check_output(
    ['git', 'ls-files', '--others', '--exclude-standard'], cwd=root, text=True, encoding='utf-8').splitlines()
    if name.startswith('docs/art/') and name.endswith('.webm') and name not in state['untracked']]
receipt['newLegacyMovies'] = []
if new_movies:
    archive = out / 'legacy-new-movies.zip'
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for name in new_movies:
            z.write(root / name, name)
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        for name in new_movies:
            p = root / name
            movie_hash = digest(p)
            assert hashlib.sha256(z.read(name)).hexdigest() == movie_hash
            kept = root / '.audit-tmp/content-r5/legacy-new-movies' / name
            kept.parent.mkdir(parents=True, exist_ok=True)
            assert not kept.exists()
            assert p.resolve().is_relative_to(root) and kept.resolve().is_relative_to(root / '.audit-tmp/content-r5')
            p.rename(kept)
            assert digest(kept) == movie_hash
            receipt['newLegacyMovies'].append({'path': name, 'sha256': movie_hash,
                                                'archive': archive.relative_to(root).as_posix()})
    receipt['archives'].append({'path': archive.relative_to(root).as_posix(), 'bytes': archive.stat().st_size,
                                'sha256': digest(archive)})
receipt['initialUntracked'] = state['untracked']
receipt['status'] = 'VERIFIED'
(out / 'receipt.json').write_text(json.dumps(receipt, indent=2, ensure_ascii=False), encoding='utf-8')
print(f'VERIFIED: {len(changed)} historical files archived and restored; {len(chunks)} archives; initial untracked intact.')
