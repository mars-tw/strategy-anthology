from pathlib import Path
import subprocess,os,json,sys,datetime
root=Path(__file__).resolve().parents[1];out=root/'docs/content/r17/verification';out.mkdir(parents=True,exist_ok=True)
temp=root/'.audit-tmp/r17/browser-temp';temp.mkdir(parents=True,exist_ok=True)
env={**os.environ,'PYTHONIOENCODING':'utf-8','TEMP':str(temp),'TMP':str(temp)}
for k in ['R15_FOCUS','R16_FOCUS','R17_FOCUS']:env.pop(k,None)
kind=sys.argv[1] if len(sys.argv)>1 else 'verify'
commands={'verify':['npm.cmd','run','verify'],'perf':['npm.cmd','run','test:perf:r17'],'r17':['node','scripts/content-r17-e2e.mjs'],'layout':['node','scripts/content-r15-e2e.mjs'],'relay':['node','scripts/content-r15-e2e.mjs'],'r16':['node','scripts/content-r16-e2e.mjs'],'supplemental':['node','scripts/content-r17-e2e.mjs']}
if kind in ['layout','relay']:env['R15_FOCUS']=kind
if kind=='supplemental':env['R17_FOCUS']='supplemental'
started=datetime.datetime.now(datetime.timezone.utc).isoformat()
with (out/f'{kind}.txt').open('w',encoding='utf8') as log:r=subprocess.run(commands[kind],cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT)
(out/f'{kind}-execution.json').write_text(json.dumps({'status':'VERIFIED' if r.returncode==0 else 'BLOCKED','command':commands[kind],'startedAt':started,'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'exitCode':r.returncode,'headless':True,'browserArgs':['--mute-audio']},indent=2)+'\n',encoding='utf8')
print(kind,r.returncode,flush=True);sys.exit(r.returncode)
