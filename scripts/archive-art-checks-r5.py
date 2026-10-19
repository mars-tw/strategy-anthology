"""Preserve this run's legacy audit outputs, then restore historical evidence."""
from pathlib import Path
import subprocess,json,hashlib,shutil
root=Path(__file__).resolve().parents[1]
assert Path.cwd().resolve()==root
destination=(root/'docs/art/r5/legacy-checks').resolve()
assert destination.is_relative_to(root/'docs/art/r5')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def eligible(p):
    return p=='docs/art/visual-audit.json' or any(p.startswith(q) for q in ['docs/art/r2/','docs/art/r3/','docs/art/r4/','docs/art/compare/after/'])
def target(p):
    rel=p.removeprefix('docs/art/')
    if rel=='visual-audit.json' or rel.startswith('compare/'):rel='r1/'+rel
    result=(destination/rel).resolve()
    assert result.is_relative_to(destination)
    return result
modified=subprocess.check_output(['git','diff','--name-only','-z']).decode('utf-8').split('\0')
tracked=[p for p in modified if p and eligible(p)]
new=subprocess.check_output(['git','ls-files','--others','--exclude-standard','-z']).decode('utf-8').split('\0')
generated=[p for p in new if p and eligible(p)]
records=[]
for p in tracked+generated:
    source=(root/p).resolve();assert source.is_relative_to(root/'docs/art') and source.is_file()
    out=target(p);out.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(source,out)
    assert sha(source)==sha(out)
    records.append(dict(original=p,archived=out.relative_to(root).as_posix(),sha256=sha(source),bytes=source.stat().st_size,newlyGenerated=p in generated))
# Restore only explicit tracked paths that were clean at task start. No untracked deletion.
if tracked:subprocess.run(['git','restore','--',*tracked],check=True)
for p in generated:
    source=(root/p).resolve();out=target(p)
    # Move only this task's new audit artifacts to their verified archive.
    assert source.is_relative_to(root/'docs/art') and out.is_relative_to(destination)
    assert sha(source)==sha(out)
    source.replace(out)
# Rebind archived audit links while keeping each byte-exact JSON receipt as well.
mapping={r['original']:r['archived'] for r in records}
def rebind(value):
    if isinstance(value,list):return [rebind(v) for v in value]
    if isinstance(value,dict):return {k:rebind(v) for k,v in value.items()}
    if isinstance(value,str):
        if value in mapping:return mapping[value]
        candidate=Path(value)
        if candidate.is_absolute():
            try:
                relative=candidate.resolve().relative_to(root).as_posix()
                if relative in mapping:return str(root/mapping[relative])
            except ValueError:pass
    return value
for record in records:
    out=root/record['archived']
    if out.suffix!='.json':continue
    raw=out.with_name(out.stem+'-original.json');shutil.copy2(out,raw)
    data=rebind(json.loads(out.read_text(encoding='utf-8')))
    if isinstance(data,dict):data['archiveNote']='Artifact paths rebound to R5 archive; byte-exact original JSON retained alongside.'
    out.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    record['originalSHA256']=record['sha256'];record['rawOriginal']=raw.relative_to(root).as_posix();record['sha256']=sha(out)
destination.mkdir(parents=True,exist_ok=True)
(destination/'index.json').write_text(json.dumps(dict(status='VERIFIED',method='Exact file copies with SHA-256, explicit tracked restore. Only newly generated legacy audit artifacts relocated; pre-task untracked Muse files untouched.',records=records),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(dict(status='VERIFIED',historicalTrackedRestored=len(tracked),newAuditArtifactsRelocated=len(generated))))
