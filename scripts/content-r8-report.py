"""Produce the bounded review set from verified, original-size browser captures."""
import hashlib
import json
import shutil
from pathlib import Path

root=Path(__file__).resolve().parent.parent
out=root/'docs/content/r8'
load=lambda p:json.loads((root/p).read_text(encoding='utf8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
e=load('docs/content/r8/e2e.json')
v=load('docs/content/r8/verification-artifacts/npm-verify.json')
p=load('docs/content/r8/performance.json')
scan=load('docs/content/r8/verification-artifacts/release-check.json')
proof=load('docs/content/r8/proof-e2e.json')
legacy=load('docs/content/r8/supplementary-legacy-captures.json')
assert e['status']==v['status']=='VERIFIED' and scan['secretScan']['matches']==0
assert proof['status']=='VERIFIED' and proof['buildSHA256']==v['buildSHA256']
assert e['buildSHA256']==v['buildSHA256']==p['buildSHA256']==sha(root/'dist/game.js')
selection=[
 ('relay-maps-expanded','同視角前段／尾段／中段覆蓋與首次接敵點'),
 ('relay-upstream-hit','上游留塔實際命中，數字避開塔與敵軍'),
 ('relay-gate-hit','城門留塔實際命中，觀察塔共鳴口徑一致'),
 ('relay-crystals-reload-receipt','拆取結晶的重載收據，不能重領'),
 ('relay-replay-compare','相同首波、留塔歸因、差值與配置差異'),
 ('terrain-barricade-enter-1','輔助關閉，前鋒接近封閉點'),
 ('terrain-barricade-enter-2','同一隊前鋒向北轉彎'),
 ('terrain-barricade-enter-3','同一隊前鋒進入北側新路'),
 ('terrain-flood-crossfire','實際入水與冰塔交火；岸上沒有行速標籤'),
 ('terrain-replay-compare','同塔位、同 200 結晶首波比較交火與漏敵差異'),
 ('exercise-turn-complete','聚印轉角：相鄰共鳴，演習完成'),
 ('exercise-levee-combat','分守長堤：分散塔位交戰中'),
 ('exercise-switchback-combat','折返雙隘：折返道路交戰中'),
 ('exercise-split-combat','雙岸接力：兩岸分工交戰中'),
 ('exercise-hollow-failed','空哨折道：同額失敗、固定敵軍名稱與真實缺口'),
]
all_shots=e['shots']+proof['shots']+legacy
shots={a['path']:a for a in all_shots}
barriers=[shots[f'docs/content/r8/phone-terrain-barricade-enter-{i}.png']['frame'] for i in (1,2,3)]
lead=barriers[0]['progress']['id']
positions=[next(u for u in frame['units'] if u['id']==lead) for frame in barriers]
assert positions[1]['nativeY']<positions[0]['nativeY']
assert positions[2]['nativeX']>positions[1]['nativeX'] and positions[2]['nativeY']<=98
assert all(not frame['contentR2']['arrows'] for frame in barriers)
(out/'capture-index.md').write_text('# R8 原尺寸擷取清單\n\nVERIFIED：以下原圖分別由 e2e.json、proof-e2e.json 與 supplementary-legacy-captures.json 綁定同一建置；全部為本次實跑原圖。\n\n'+'\n'.join(f"- `{a['path']}`：{a['viewport']['width']}×{a['viewport']['height']} CSS，DPR {a['dpr']}。" for a in all_shots)+'\n',encoding='utf8')
review=out/'review-set';review.mkdir(exist_ok=True)
index=[]
for i,(name,why) in enumerate(selection,1):
    src=out/f'phone-{name}.png'
    assert src.relative_to(root).as_posix() in shots
    data=src.read_bytes()
    assert (int.from_bytes(data[16:20],'big'),int.from_bytes(data[20:24],'big'))==(430,932)
    dest=review/f'{i:02d}-{name}.png';shutil.copy2(src,dest)
    assert sha(dest)==sha(src)==shots[src.relative_to(root).as_posix()]['sha256']
    index.append({'path':dest.relative_to(root).as_posix(),'source':src.relative_to(root).as_posix(),'sha256':sha(dest),'purpose':why})
assert len(list(review.glob('*.png')))==15
(out/'review-set-manifest.json').write_text(json.dumps(index,ensure_ascii=False,indent=2),encoding='utf8')
(out/'REVIEW_INDEX.md').write_text('# R8 審查截圖精選\n\nVERIFIED：15 張 430×932 原圖，三項各 5 張，逐位元組複製；無裁切、縮放、拼圖或補畫。06～08 是同一隊改道連續三格。\n\n'+ '\n'.join(f"- `{a['path']}`：{a['purpose']}。" for a in index)+'\n\n精選上限 15 張，五題各精選一態；每題選位、交戰、完成、同額失敗四態，以及火冰雷命中三格、入水三格、拆晶前後與渡口冰塔，均保留在上層 r8 原圖，完整擷取清單及當格座標見 e2e.json。\n',encoding='utf8')
# Preserve exploratory captures separately; only captures bound to this verified
# build remain in the deliverable's phone-* collection.
for candidate in out.glob('phone-*.png'):
    if candidate.relative_to(root).as_posix() not in shots:
        target=root/'.audit-tmp/content-r8/exploratory-captures'/candidate.name
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.move(str(candidate),str(target))
art=[root/q for q in ['public/assets/content-r7/legacy-cannon.webp','public/assets/content-r7/flood.webp','public/assets/content-r6/barricade.webp','public/assets/r4/tower-cannon.png','public/assets/r4/tower-frost.png','public/assets/r4/tower-tesla.png']]
(out/'art').mkdir(exist_ok=True)
(out/'art/manifest.json').write_text(json.dumps({'status':'VERIFIED','newGeneratedArt':0,'newGenerationTool':None,'reusedSourceTool':'image_gen__imagegen','sourcePrompts':'docs/content/r7/art/PROMPTS.json','note':'No image generation was performed in R8. Existing authored sprites are reused with canvas projection, clipping, scale and independent bases.','reused':[{'path':q.relative_to(root).as_posix(),'sha256':sha(q)} for q in art]},ensure_ascii=False,indent=2),encoding='utf8')
performance='；'.join(f"{a['scenario']} {a['width']}×{a['height']}：三跑中位 p95 {a['medianP95']:.2f}ms" for a in p['summary'])
exercise_rows='\n'.join(f"| {name} | `phone-exercise-{id}-formation.png` | `phone-exercise-{id}-combat.png` | `phone-exercise-{id}-complete.png` | `phone-exercise-{id}-failed.png` |" for id,name in [('turn','聚印轉角'),('levee','分守長堤'),('switchback','折返雙隘'),('split','雙岸接力'),('hollow','空哨折道')])
report=f'''# 三相邊境｜新內容 R8 交付

VERIFIED：2026-10-19，v0.16.0。依三份 R7 審查，完成 Muse 唯一五項驗收的本機修改與無頭驗證。未推送、部署、操作商店或對外派工。Muse 8 分以上仍需獨立複審，不能由本次自驗代替。

## 三項內容、玩法與正常入口

1. **攻下一座，留下一塔**：石脊攻城勝利頁 → 三選一，可點「放大射擊路段」。同視角圖以粗線畫實際可打道路、白印畫首次接敵點；上游先削前段、城門補尾段、拆晶換中段新塔。留塔命中及傷害單獨記錄，拆晶保留一次入帳收據；渡口冰塔接力也有補圖。
2. **戰前改地形**：守城第一波前 →「戰前工事」。封閉的舊路有塌石木柵，輔助關閉仍可辨識；北側道路為角色留出完整顯示空間，可看見轉彎。減速數據取自真實模擬，慢行區包含濕泥岸；只有物理上正在減速、且已明顯深入原畫水面的敵軍才顯示行速×52% 與累積延遲標籤，標籤避讓角色。相同兩塔與 200 結晶首波實測呈現交火、攔下數、耐久及延遲的差異；地圖與觸控使用同一投影，另以直接點擊畫面敵軍驗證震擊命中，見 `phone-terrain-touch-hit.png`。
3. **三印窄陣**：首頁 →「三印窄陣」，或戰前工事 →「先試三印窄陣」。五題保留原路形、固定預算及勝敗解；每個塔位有獨立顯示底座，空位用虛線。選塔、換位、確認付款、開戰、重載、完成均可實際操作。無共鳴稱「分散接力」，失敗先顯示真實首漏及缺口，另按「展開塔位提示」看具體解題句。

暫停 →「本次決定回顧」／守城完成 →「並排決定回顧」及「換另一分支重打本場」，均接在正常流程。回顧正文、比較表與差值一律用不可變的**本章首波快照**；全塔火力不含震擊傷害，留塔另列。全章結算另標「全章擊退／全章用時」。舊資料缺少首波明細、或任何一邊零命中時，先顯示引導，不拿空資料比較。北路實際行軍與涉水新增延遲分列，明說不可相減；不同新建塔位／等級會標示不能歸因給單一留塔。

## Muse 五項驗收與原尺寸證據

以下檔名均位於 `docs/content/r8/`，手機原圖為 430×932；每張完整路徑見 `capture-index.md`；各擷取清單的當格呈現資料與 SHA-256 綁定相同建置。

| 唯一驗收項目 | 實作與驗證 | 原圖 |
|---|---|---|
| 1．接力比較圖 | 同視角、粗亮實際覆蓋路段、首次接敵點；三分支真實首波命中及留塔統計 | `phone-relay-maps-expanded.png`、`phone-relay-choices.png`；三分支 `phone-relay-<upstream/gate/crystals>-hit.png`、`-review.png` |
| 2．堵隘封閉與改道 | 輔助關閉，塌石木柵中斷舊路；同隊接近、北轉、走新路 | `phone-terrain-barricade-before.png`、`-after.png`、`-enter-1.png`、`-enter-2.png`、`-enter-3.png` |
| 3．浮字與橫幅遮擋 | 工事與狀態移到場外，傷害框避開全部塔／敵軍矩形，火冰雷實際命中三格 | `phone-impact-<cannon/frost/tesla>-before.png`、`-hit.png`、`-after.png` |
| 4．五題差異與塔位 | 五題各有不同路形或塔位分工、獨立完整塔體、虛線空位；同額勝敗及存檔 | 下表各四態，另有 `-moving.png`、`-losing-formation.png` |
| 5．回顧差值與範圍 | 相同首波、全塔／留塔分開、差值欄、地形無關列不顯示、零命中引導 | `phone-relay-replay-compare.png`、`phone-terrain-replay-compare.png`、`phone-zero-hit-review.png` |

| 題目 | 選位 | 交戰 | 完成 | 同額失敗 |
|---|---|---|---|---|
{exercise_rows}

補齊未見證據：`phone-relay-crystals-claimed.png`、`phone-relay-crystals-reload-receipt.png`、`phone-relay-crystals-next.png` 證明拆晶收據與下一場；`phone-relay-ford-inherited.png`、`phone-relay-ford-ice-hit.png` 證明渡口冰塔接力。留守火塔舊旗／修補石基可見於三分支 next／hit 圖；入水連續三格為 `phone-terrain-flood-enter-1.png`～`-3.png`，實際冰塔交火另見 `phone-terrain-flood-crossfire.png`。五題重載保存、同額勝敗與錢包隔離有實際測試記錄，沒有注入血量、結晶或勝敗。

**精選集：`docs/content/r8/review-set/` 恰好 15 張，三項各 5 張。** 全部原圖逐位元組複製；06～08 為同隊改道連續三格。五題各精選一態，其他四態保留完整原圖，以遵守審查最多 15 張的上限；索引 `REVIEW_INDEX.md` 與 `review-set-manifest.json` 提供每張來源與雜湊，沒有拼圖代替原圖。

另外補齊未見證據：`phone-relay-replay-wave4-combat.png`、`phone-relay-replay-wave4-combat-2.png` 與 `phone-relay-replay-four-waves-complete.png` 依序呈現第 4／4 波實際交火與重演完成；`phone-relay-original-before-replay.png`、`phone-relay-original-after-replay.png`、`phone-relay-original-return-reloaded.png` 對照原錢包與原戰局。另保留本次 R3 實跑的 `phone-exercise-turn-alternative-formation.png`／`-complete.png`、`phone-exercise-switchback-alternative-formation.png`／`-complete.png`，以及三題 `phone-exercise-<id>-resumed.png`；來源及雜湊見 `supplementary-legacy-captures.json`。沒有組合或偽造完成存檔。

商店新增原圖：`docs/store/screenshots/iphone-content-r8-flood-1290x2796.png`、`docs/store/screenshots/ipad-content-r8-flood-2064x2752.png`。以對應 DPR 真實擷取，既有商店圖先封存重跑輸出再還原，逐檔雜湊確認。

## 測試、效能與保留

VERIFIED：`npm run verify` exit 0；138 項單元測試、既有主流程／美術／R1～R7 與新增 R8 無頭操作均通過。R8 為 {len(e['checks'])} 項斷言、{len(e['shots'])} 張原尺寸擷取，無執行錯誤與外部請求。包含三分支首波、五題同額勝敗、存檔重載、離線冷啟完成及地形同額比較。既有 R7 回歸實跑完整四波重演；另外執行 `npm run test:content:r8:proof`，{len(proof['checks'])} 項補證斷言、{len(proof['shots'])} 張原圖，明確拍下第 4 波交火、完成與返回後重載，確認不重領、不動原戰局與共用錢包。

既有 R3 狀態條檢查改為「狀態條完整在場外、界碑完整在場內、矩形不相交」，配合本輪移出橫幅且加強可視性。R7 測試把兩個錯誤介面預期改為更嚴格的新契約：首漏須等於實際出場序號且不得有內部代碼；零命中須有引導且不得有表格。R6 地形回顧改在首波完成後才驗收，並核對首波紀錄、七隻實際入區敵軍及真正使用的 R7 水面素材。並排表新增差值欄，欄數由三變四。沒有刪測試、跳過測試或放寬數值條件。

手機 320×568／430×932、橫式 844×390、iPad 1032×1376／1376×1032 通過無頭觸控可達、≥44px、無頁面溢出與手機無鍵盤提示；另以本機無頭檢查 1366×600、1280×640 矮桌機。這些是瀏覽器模擬，沒有冒稱實體裝置測試。

{p['status']}：並發機況真實 RAF 共 {len(p['runs'])} 次、各 180 格；{performance}。18ms 為參考門檻，不是乾淨機或實體 iOS 保證，原始值見 `performance.json`。

VERIFIED：秘密掃描 {scan['secretScan']['files']} 個檔案，零命中；發行建置 SHA-256 `{v['buildSHA256']}`。驗證收據與歷史輸出封存／還原收據在 `verification-artifacts/`，當次使用的自然取得攻城存檔副本亦在其中 historical 路徑；原有未追蹤審查檔保留。只在本 repo／main 本機提交。

新增美術 **0 張**：沿用既有 `image_gen__imagegen` 原畫，這輪未呼叫產圖工具，也不冒稱新生成；使用同一風格素材做場景投影、裁切、尺度與底座避讓。來源及雜湊見 `art/manifest.json`。沒有方塊或 emoji 冒充美術。

## 文案修改摘要（speak-human-tw mode 2）

本輪整理以下 8 類介面文案，直接套用並保留修改理由。

| 原句 | 原因 | 改成什麼 |
|---|---|---|
| 火印 t1 → 敵軍 u4／首漏 u6 | 內部代碼不能幫助玩家辨認 | 具名火塔及固定出場序號的甲犬；退場不重新編號 |
| 傷害共鳴・尚未成陣 | 誤判有效分散配置 | 分散接力・觀察塔共鳴 0%；只說明觀察塔的實際加成 |
| 第 2 波／相同首波／主力塔累計混列 | 不同範圍混在同一回顧 | 全部採首波快照，全塔與留塔分列；全章結算另外標示 |
| 52%／慢行 52% | 不清楚是剩餘速度或減速幅度 | 濕地行速×52%；只在原畫的可見水面顯示個別標籤，累計延遲含濕泥區 |
| 城門折角／城門前路 | 同一位置兩種叫法 | 統一城門前路 |
| 兩邊零命中仍顯示比較表 | 空資料無法支持決策 | 提示確認射程並完成首波；無表格 |
| 審查所見「前次與本次賽測」 | 用字錯誤／統計不明 | 前次與本次實測，明示相同首波範圍 |
| 第 4 號中央哨射不到北折新路，故意留空；把三印預算分給外沿。 | 開始前直接公布完整解法 | 北折與東岸相距遠；先看各界碑射程，預算只夠三塔。具體解題句留在失敗後自選展開 |

## 未完成與風險

**Apple 4.3 風險：中。** 留塔跨場接力、改路再排塔、固定預算留空解題持續強化差異，核心仍為元素塔防；平台判定需正式審查。維持 MIT、免費、無廣告、無內購、無帳號及離線玩法，未加入外部連結、第三方 SDK 或線上功能。

BLOCKED：實體 iPhone／iPad 直橫切換、觸控及離線冷啟需要真機與測試人員；真人／親子試玩與音效聽感需要實際參與者；乾淨機效能需要不受其他線路影響的設備；Muse 8 分以上需要獨立複審。這些未假造結果。其餘本機可做的玩法、截圖及測試已完成。
'''
(root/'docs/CODEX_RESPONSE_CONTENT_R8.md').write_text(report,encoding='utf8')
print('VERIFIED: review-set 15 originals; report and reuse manifest generated')
