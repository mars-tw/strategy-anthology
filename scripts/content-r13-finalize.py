"""Verify native artifacts, curate the sole review set and write the R13 delivery."""
from pathlib import Path
import json,hashlib,shutil,struct,subprocess,re,os
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/content/r13'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def run():
 assert (ROOT/'.audit-tmp/r13/verify-exit.txt').read_text(encoding='utf-8-sig').strip()=='0','Full verify is not green'
 build=sha(ROOT/'dist/game.js');shots=[]
 for n in ['e2e.json','regression-r11-e2e.json','regression-r11-proof-e2e.json','regression-r12-sluice-e2e.json']:
  v=read(OUT/n);assert v['status']=='VERIFIED' and not v['errors'] and v['buildSHA256']==build,n
  assert 'scope' not in v,'Partial development receipt is not delivery'
  for s in v['shots']:assert sha(ROOT/s['path'])==s['sha256'],s['path']
  shots+=v['shots']
 contrast=read(OUT/'contrast-readback.json');assert contrast['status']=='VERIFIED' and not contrast['errors'] and contrast['buildSHA256']==build and contrast['contrast']['ratio']>=4.5
 for shot in contrast['shots']:assert sha(ROOT/shot['path'])==shot['sha256']
 shots+=contrast['shots']
 initial=read(ROOT/'.audit-tmp/r13/initial.json')
 for name,digest in initial['untracked'].items():assert sha(ROOT/name)==digest,name
 source_input=read(OUT/'verification/input.json');visual=read(OUT/'verification/post-verify-visual.json');assert visual['status']=='VERIFIED' and visual['gameSHA256']==build
 patch=visual['exactAppendedUTF8'].encode('utf8')
 for name,digest in source_input['buildSources'].items():
  if name==visual['path']:
   data=(ROOT/name).read_bytes();assert data.endswith(patch) and sha(ROOT/name)==visual['afterSHA256'];assert hashlib.sha256(data[:-len(patch)]).hexdigest()==digest==visual['beforeSHA256']
  else:assert sha(ROOT/name)==digest,name
 for name,data in source_input.get('postVerifySources',{}).items():assert sha(ROOT/name)==data['sha256'],name
 style=(ROOT/'dist/style.css').read_bytes();assert style.endswith(patch) and hashlib.sha256(style[:-len(patch)]).hexdigest()==visual['beforeStyleSHA256'] and sha(ROOT/'dist/style.css')==contrast['styleSHA256']
 for name in subprocess.check_output(['git','ls-tree','-r','--name-only','-z',initial['commit'],'--','docs/store/screenshots'],cwd=ROOT).decode().strip('\0').split('\0'):
  if name:assert (ROOT/name).read_bytes()==subprocess.check_output(['git','show',initial['commit']+':'+name],cwd=ROOT),'Existing store changed: '+name
 cleanup=read(OUT/'cleanup.json');assert cleanup['allAbsent'] and all(not (ROOT/r['path']).exists() for r in cleanup['files'])
 cleanup['status']='VERIFIED';cleanup['fullVerifyAfterDeletion']='exit 0, isolated byte-identical source copy';write(OUT/'cleanup.json',cleanup)
 rows=[('relay','relay-value-choices-contrast'),('relay','relay-upstream-combat'),('relay','relay-upstream-four-wave-result'),('relay','relay-gate-four-wave-result'),('relay','relay-crystals-four-wave-result'),('terrain','regression-r11-phone-terrain-barricade-proof-turn-1'),('terrain','regression-r11-phone-terrain-barricade-proof-turn-2'),('terrain','regression-r11-phone-terrain-barricade-proof-turn-3'),('terrain','terrain-flood-enter'),('terrain','terrain-flood-exit'),('exercise','sluice-before-release'),('exercise','sluice-release-instant'),('exercise','sluice-flowing-reloaded'),('exercise','sluice-ended-summary'),('exercise','sluice-unused-result')]
 selected=[];current_shots={s['path']:s['sha256'] for s in shots}
 for i,(category,name) in enumerate(rows,1):
  source=OUT/(f'{name}.png' if name.startswith('regression-') else f'phone-{name}.png');assert struct.unpack('>II',source.read_bytes()[16:24])==(430,932)
  assert current_shots.get(source.relative_to(ROOT).as_posix())==sha(source),'Review image missing from current-build receipt: '+name
  label=name.removeprefix('regression-r11-phone-');target=OUT/'review-set'/f'{i:02}-{label}.png';target.parent.mkdir(exist_ok=True);shutil.copy2(source,target);assert sha(source)==sha(target)
  selected.append({'category':category,'source':source.relative_to(ROOT).as_posix(),'path':target.relative_to(ROOT).as_posix(),'sha256':sha(target),'dimensions':[430,932]})
 assert len(list((OUT/'review-set').iterdir()))==15
 final=read(OUT/'e2e.json');unused=next(s for s in final['shots'] if s['path'].endswith('phone-sluice-unused-result.png'))
 assert [r['mode'] for r in final['outcomes']]==['early','timed','unused']
 for name,size in [('iphone',(1290,2796)),('ipad',(2064,2752))]:
  p=ROOT/f'docs/store/screenshots/{name}-content-r13-sluice-{size[0]}x{size[1]}.png';assert struct.unpack('>II',p.read_bytes()[16:24])==size
 evidence=ROOT/'docs/evidence/content-r13';evidence.mkdir(exist_ok=True)
 for source,name in [('phone-layout-430x932-combat.png','phone-430x932.png'),('phone-layout-844x390-combat.png','landscape-844x390.png'),('phone-layout-1032x1376-combat.png','ipad-1032x1376.png')]:shutil.copy2(OUT/source,evidence/name)
 write(OUT/'review-index.json',{'status':'VERIFIED','buildSHA256':build,'images':selected,'distribution':{'relay':5,'terrain':5,'exercise':5}})
 write(OUT/'capture-index.json',{'status':'VERIFIED','buildSHA256':build,'shots':shots,'postSuiteStyleOnlyReadback':'contrast-readback.json; one appended text-color rule, all other style bytes and the entire game bundle unchanged'})
 (OUT/'REVIEW_INDEX.md').write_text('# R13 審查精選\n\nVERIFIED。15 張 430×932 原尺寸手機直式圖，三項各 5 張。木柵三格追蹤同一前鋒；潮閘依序呈現未開、瞬間、重載後流動、結束及失敗結算。第15張同時保留首漏敵軍與同陣三種時機的實測表。水門原畫為靜態，未宣稱有閘板動畫。\n\n'+'\n'.join(f'- {i:02}．{r["category"]}：[原圖]({r["path"].split("r13/")[1]})' for i,r in enumerate(selected,1))+'\n',encoding='utf8')
 perf=read(OUT/'performance.json');assert perf['status']=='VERIFIED' and perf['buildSHA256']==build and all(s['medianP95']<=18 for s in perf['summary'])
 # Scan the final repo only, never the owner's secret directory or dependencies.
 pattern=re.compile('sk-proj-'+'[A-Za-z0-9_-]{20,}|sk-'+'[a-z0-9]{40}');matches=[];scanned=0
 for base,dirs,files in os.walk(ROOT):
  dirs[:]=[d for d in dirs if d not in ['.git','node_modules','.audit-tmp']]
  for name in files:
   p=Path(base)/name
   if p.suffix.lower() in ['.png','.webp','.jpg','.jpeg','.woff','.woff2','.mp4','.webm','.zip','.ico']:continue
   scanned+=1
   if pattern.search(p.read_text(encoding='utf8',errors='replace')):matches.append(p.relative_to(ROOT).as_posix())
 write(OUT/'verification/secret-scan.json',{'status':'VERIFIED' if not matches else 'BLOCKED','files':scanned,'matches':len(matches),'paths':matches});assert not matches
 log=ROOT/'.audit-tmp/r13/verify.txt';raw=log.read_bytes();text=raw.decode('utf16') if raw.startswith(b'\xff\xfe') else raw.decode('utf-8-sig');(OUT/'verification/verify.txt').write_text(text,encoding='utf8')
 assert '184 passed' in text
 retained=read(OUT/'retained-legacy-test-inputs.json');original_tests=read(OUT/'verification/original-tests-readback.json');unchanged_count=len(original_tests['unchangedFiles']);clock_count=len(original_tests['clockHarnesses']);max_p95=max(s['medianP95'] for s in perf['summary'])
 paragraphs=f'''# 三相邊境・新內容第13輪交付

VERIFIED。版本 **0.21.0**；實際執行日 2026-10-20，main，僅本機提交。依 R12 Muse「下一輪最該做的5件事」逐項完成，同時修復 GPT／Claude 的七個具體呈現問題。Muse ≥8 分為目標，仍待獨立複審，沒有自評冒充評審分數。

## 三項內容與入口

1. **攻下一座，留下一塔**：正常渡口／石脊攻城勝利後選留塔或拆晶。石脊三選一先顯示首波路線、位置、射程與一級26傷害；拆晶明示無繼承塔與+90用途。留守與新建同級火塔共用紅頂原畫、塔卡輪廓，只加來源牌與底環。留守牌改到敵軍與特效之後繪製，另建價格明示「另建一座」，三塔齊時提示開始下一波。
2. **戰前改地形**：守城第一波前 →「戰前工事」。木柵加深輪廓與封路符號，戰鬥保留灰虛線舊路與淡朱新路；輔助關閉只關箭頭，實體新路仍可辨。水面改沿實際路段延伸，岸線及進出水邊界固定，離水顯示恢復行軍。縱向水道保留頭部／血條間距，所有傷害標籤帶元素名及指向受擊目標的線。
3. **三印窄陣＋潮閘截流**：首頁 →「三印窄陣」→五題演習／「新演習・潮閘截流」。空塔位補上既有石基。未開閘可看作用段，按下瞬間全段高亮；流動有固定岸線、倒數與累計進水，水流停止立即顯示摘要。失敗直接保留攔下、首漏位置／生命、開閘時刻、進水數與全隊延遲；「同陣重試」保留原塔位、等級、支出與預算，重置本場水流。最近三場實際結果可並列比較。

## Muse 唯一五項驗收與原尺寸證據

| 驗收 | 本輪完成與截圖 |
|---|---|
| 1．選擇前看留塔價值 | `phone-relay-value-choices-contrast.png` 三張圖均有位置、射程與第一波接敵點；`phone-relay-upstream-combat.png` 同場留守／新建火塔同輪廓。`phone-relay-*-four-wave-result.png` 三分支實際打完四波，結果與重載已驗。 |
| 2．改地形全程可讀 | `phone-terrain-barricade-turn-1.png`、`-2.png`、`-3.png` 同一前鋒連續三格；`phone-terrain-flood-enter.png`／`phone-terrain-flood-exit.png` 清楚保留岸線、入水／離水狀態。`phone-terrain-*-preview.png` 補戰前灰虛線／新路；均在本輪目錄。 |
| 3．潮閘決策四個狀態 | `phone-sluice-before-release.png`、`phone-sluice-release-instant.png`、`phone-sluice-flowing-reloaded.png`、`phone-sluice-ended-summary.png`。同場中途重載保持倒數、進水紀錄與只能一次；停止後不能重開。 |
| 4．密集交戰遮擋 | 各敵軍沿路縱隊分開，水道加頭部間距，各自血條最後繪製；每個目標的傷害字以實際命中紀錄排入220ms時段，不改命中時機。`phone-sluice-flowing-reloaded.png`、`phone-terrain-flood-enter.png` 及 `regression-r12-phone-exercise-*-densest.png` 五題密集圖。明細已有其他塔命中時立即顯示實際事件，不再假等選中塔開火。 |
| 5．失敗接回重試決策 | `phone-sluice-unused-result.png` 同時呈現首漏、全部水流數字與三種實測結果；`phone-sluice-early-result.png` 補過早失敗。`phone-sluice-*-same-formation.png` 配置／預算一致，自動操作與單元測試均核對，五題含升級亦可保留。 |

上述檔案均位於 `docs/content/r13/`。唯一精選資料夾為 `docs/content/r13/review-set/`：**15張430×932原尺寸圖，三項各5張**，01～15排序，逐檔來源、尺寸、SHA-256見 `review-index.json`。第15張把三種時機與失敗決策放在同一個遊戲結果頁，沒有拼貼截圖。

R12 所標「未見證據」另補：`regression-r11-phone-relay-replay-wave4-combat.png`／`-2.png`、`regression-r11-phone-relay-replay-four-waves-complete.png`、`regression-r11-phone-relay-original-return-reloaded.png` 證明四波重演與返回原局；渡口冰塔命中為 `regression-r11-phone-relay-ford-ice-hit.png`；冰霜與涉水明細為 `phone-terrain-flood-frost-details.png`。三分支、五題成功／同額失敗、潮閘三結果與離線原圖均保留在本輪，完整索引 `capture-index.json`，不以領取或說明頁冒充遊玩。

## 工程驗證

**VERIFIED：清理後完整 `npm run verify` exit 0。** 執行位置為本 repo 內 `.audit-tmp/r13/verify/` 的一般檔案隔離副本：原始碼、全部既有測試與必要輸入逐檔一致，避免歷史腳本覆寫工作區中初始未追蹤的截圖或舊商店圖。原178項＋新增6項，共 **184項Vitest全綠**，原作規則、R11主套／補證、主流程／RWD、原美術稽核、R1～R9、R12、新增R13無頭操作全部通過。原始輸出 `verification/verify.txt`；各套收據 `verification/receipts/`。沒有刪除既有測試或放寬既有斷言。 {clock_count}份瀏覽器回歸僅補重載後凍結測試時鐘，新增時鐘與存檔不變斷言；移除新增的時鐘呼叫後，各份原測試程式與原始commit逐字相同，另{unchanged_count}份原腳本／測試未改。

完整套件通過後，原圖目視檢查只追加一條選中卡文字色規則；整份遊戲JS與原樣式前綴位元組均未改。新增10項原尺寸視覺回讀，選中卡對比達5.12:1、所有控制仍≥44px，見 `contrast-readback.json` 與 `verification/post-verify-visual.json`。效能場景不含這個選擇卡。精選01採用修正後原圖；全套原始收據與修正前原圖保留，不把局部回讀冒充重跑整套。

`scripts/audit.mjs` 改為核對 repo 內的完整來源基準快照，固定 SHA-256 綁定原基準；41項全部保留，40項核對 vendor／公開資產實際位元組與大小。原匯入時未收錄的 `vendor/tower-defense/scripts/test-config.js` 仍保留原記錄雜湊，列為 recorded-hash-only，不假稱讀取到檔案。兩原作 HEAD／status 驗證的是不可變匯入快照，明列 historical snapshot，沒有把它說成已刪除 repo 的即時 Git 狀態。缺少其他副本、內容或基準被改，仍會失敗；新增負向測試驗證此行為。完整 verify 不再依賴相鄰資料夾。

手機320×568／430×932／844×390、iPad1032×1376／1376×1032、矮桌機1366×600／1280×640均實際完成潮閘並檢查控制≥44px、無頁面溢出、手機鍵盤說明隱藏。離線冷載入可完成與存檔；三項都有實際操作、完成／結果及重載驗證；沒有外部請求或執行錯誤。

新增商店圖：`docs/store/screenshots/iphone-content-r13-sluice-1290x2796.png`、`ipad-content-r13-sluice-2064x2752.png`。32張既有商店圖逐位元組保持不變。三視口複本在 `docs/evidence/content-r13/`；R12原始對照位元組在 `before/`。

效能為並發系統負載下無頭RAF參考，三情境×兩視口×各三跑，每跑180格；各組三跑中位 p95 最大 **{max_p95:.2f}ms ≤18ms**，見 `performance.json`。這不是實體iOS或乾淨機認證。秘密掃描 **0命中**，見 `verification/secret-scan.json`；建置SHA-256 `{build}`。

## 清理、美術與界線

VERIFIED：刪除 **{cleanup['count']}個** Git已追蹤且已被取代的舊證據，原檔合計 **{cleanup['bytes']/2**20:.2f}MiB**，逐檔絕對範圍、大小、雜湊在 `cleanup-plan.json`／`cleanup.json`。這是工作樹空間，Git歷史與本輪新增另計。保留全部Markdown、現行商店圖、原畫／mask／來源比較基準與測試存檔；初始快照{len(initial['untracked'])}個未追蹤檔雜湊未變。

依工單的測試輸入例外，另保留 **{retained['count']}張R12證據**：既有 `scripts/content-r12-delivery.py check()` 逐圖讀取舊收據／精選索引，故沒有為清理而刪改其斷言。完整檔名與引用來源列於 `retained-legacy-test-inputs.json`。不把這些舊圖當成本輪審查集。

新增生成美術 **0張**；沿用既有同風格火塔、塔卡、水面、木柵與水門，檔案雜湊見 `art/manifest.json`。水門是靜態生成原畫，畫面新增的是由真實狀態驅動的水流紋、高亮與岸線，沒有宣稱骨架或閘板動畫。保留原角色真姿勢圖集。

**Apple [4.3](https://developer.apple.com/app-store/review/guidelines/#spam)風險：中。** 固定塔防仍有同類型風險；跨戰留塔、改路與一次開閘時機構成自己的位置／時間決策。保持MIT、免費、離線，沒有新增廣告、付費、外連、SDK、帳號或線上功能。

BLOCKED：實體手機／iPad、真人試玩、乾淨機效能需設備、參與者與獨占測試時段；Muse正式複審及是否≥8分需審查員判定。本輪沒有push、部署、商店操作、對外傳訊或外部派工。

## 文案修改（speak-human-tw mode 2）

| 原句／原呈現 | 原因 | 改成什麼 |
|---|---|---|
| 選中紅卡的深青色數值 | 對比不足 | 只改成象牙白，實測對比5.12:1，版面與遊戲程式不變 |
| 三塔已齊仍「先配置三塔」 | 與目前操作狀態矛盾 | 「三塔已就位，按『開始下一波』。」 |
| 已有傷害仍「等待這座塔開火」 | 選中塔尚未開火時漏掉其他實際命中 | 顯示已命中塔與敵軍、實扣及可展開明細 |
| 留守卡仍只寫「需100」 | 容易誤認繼承要付款 | 「另建一座需100」與留守級別分開 |
| 水道N隻／延遲 | 累計與當前不清楚 | 「累計N隻進水／全隊延遲」並保留實測秒數 |
| 失敗後只有重新布陣 | 必須重買原三塔，無法專心重試時機 | 「同陣重試」保留配置與預算；另保留清空重排 |
| 三選一只有用途短句 | 選擇前看不到傷害與繼承價值 | 圖上射程、第一波接敵，另列繼承1級／每擊26或無繼承塔／+90 |
'''
 paragraphs+='\n## 精選原尺寸路徑\n\n'+'\n'.join(f'- {i:02}．{row["category"]}：[{row["source"]}]({row["source"].removeprefix("docs/")})（430×932）' for i,row in enumerate(selected,1))+'\n'
 (ROOT/'docs/CODEX_RESPONSE_CONTENT_R13.md').write_text(paragraphs,encoding='utf8')
 write(OUT/'verification/release-check.json',{'status':'VERIFIED','version':'0.21.0','buildSHA256':build,'fullVerifyExitCode':0,'vitest':184,'reviewImages':15,'screenshots':len(shots),'initialUntrackedPreserved':len(initial['untracked']),'deletedFiles':cleanup['count'],'deletedBytes':cleanup['bytes'],'retainedHistoricalTestImages':retained['count'],'newArt':0,'performanceMaxMedianP95':max_p95,'physicalDeviceGate':'BLOCKED','independentMuseScore':'BLOCKED'})
 print('VERIFIED final evidence:',len(shots),'originals, 15 native review images, 2 new stores, full verify and performance')
if __name__=='__main__':run()
