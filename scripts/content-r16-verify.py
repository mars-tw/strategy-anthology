"""Run the authorized serial checks with isolated, removable browser temp files."""
from pathlib import Path
import subprocess, os, json, sys, datetime
root=Path(__file__).resolve().parents[1]
out=root/'docs/content/r16/verification';out.mkdir(parents=True,exist_ok=True)
temp=root/'.audit-tmp/r16/browser-temp';temp.mkdir(parents=True,exist_ok=True)
env={**os.environ,'PYTHONIOENCODING':'utf-8','TEMP':str(temp),'TMP':str(temp)}
env.pop('R15_FOCUS',None);env.pop('R16_FOCUS',None)
kind=sys.argv[1] if len(sys.argv)>1 else 'verify'
commands={'verify':['npm.cmd','run','verify'],'perf':['npm.cmd','run','test:perf:r16'],'preflight':['node','scripts/content-r16-e2e.mjs'],'layout':['node','scripts/content-r15-e2e.mjs'],'small':['node','scripts/content-r16-e2e.mjs'],'flood':['node','scripts/content-r15-e2e.mjs']}
if kind=='layout':env['R15_FOCUS']='layout'
if kind=='small':env['R16_FOCUS']='layout'
if kind=='flood':env['R15_FOCUS']='smallwater'
started=datetime.datetime.now(datetime.timezone.utc).isoformat()
with (out/f'{kind}.txt').open('w',encoding='utf8') as log:
    run=subprocess.run(commands[kind],cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT)
(out/f'{kind}-execution.json').write_text(json.dumps({'status':'VERIFIED' if run.returncode==0 else 'BLOCKED','command':commands[kind],'startedAt':started,'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'exitCode':run.returncode,'browserTemp':str(temp),'headless':True,'browserArgs':['--mute-audio']},indent=2)+'\n',encoding='utf8')
print(kind, 'VERIFIED' if run.returncode==0 else 'BLOCKED', 'exit',run.returncode,flush=True)
sys.exit(run.returncode)
