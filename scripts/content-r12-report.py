from pathlib import Path
import json, hashlib, re
root=Path(__file__).resolve().parents[1];out=root/'docs/content/r12'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
r=read(out/'regression-e2e.json');proof=read(out/'regression-proof-e2e.json');new=read(out/'sluice-e2e.json');perf=read(out/'performance.json');clean=read(out/'cleanup.json');generated=read(out/'verification/generated-output-cleanup.json');verify=read(out/'verification/verification.json')
assert all(v['status']=='VERIFIED' for v in [r,proof,new])
continuation=read(out/'verification/continuation.json');assert continuation['status']=='VERIFIED'
vendored=read(out/'verification/vendored-source-readback.json')
phase='VERIFIED' if perf['status']=='VERIFIED' else 'BLOCKED'
perf_rows='\n'.join(f"| {s['scenario']} | {s['width']}×{s['height']} | {s['medianP95']:.2f}ms | {s['maxP95']:.2f}ms |" for s in perf['summary'])
outcomes='\n'.join(f"| {x['mode']} | {'攔下全隊' if x['result']=='won' else '越線失敗'} | {x['kills']}/10 | {len(x['gate']['wetIds'])} | {x['gate']['delay']:.2f}秒 |" for x in new['outcomes'])
text=f'''# 三相邊境・新內容第12輪

EXECUTED。玩法與畫面證據VERIFIED；完整verify有外部來源缺件，狀態BLOCKED。版本 **0.20.0**，main 分支，2026-10-20。本輪新增一項真正玩法「潮閘截流」，保留原三項的原預算、原塔位、原勝敗與已修好的留塔／拆晶／改路行為。只做本機 commit。

**驗收來源限制：BLOCKED。** 本 repo 沒有 `docs/content/CONTENT_REVIEW_R11_MUSE.md`，因此不能宣稱完成該份尚未提供的五項原文驗收。依工單的「最近評審」備援條款，以現有最新 R10 Muse 的五項為明確清單，並核對 R10 GPT／Claude 與 R11 交付。下表只聲明實際可核對的部分；Muse ≥8 分仍待獨立複審。

## 三項內容、玩法與入口

1. **攻下一座，留下一塔**：沿正常戰後選擇，石脊可留上游火塔、城門火塔或拆取90，渡口可留冰塔。地圖保留留守牌與底環，塔卡寫來源與繼承級別；拆晶購買、重載後錢包與來源一致。本輪重拍三分支選擇、領取、實際命中、完整四波重演及返回原局，不以領取畫面冒充交戰。
2. **戰前改地形**：正常守城第一波前 →「戰前工事」。保留灰虛線原路／朱線新路預覽；輔助關時仍有實體木柵、新北路、水面與流紋。重拍同一前鋒三格，各跨過至少一個原畫身寬；入水標籤須同時符合模擬水域與腳底可見水面。原涉水52%與冰霜明細保留，秒數仍由實際步進累積。
3. **三印窄陣＋新增潮閘截流**：首頁 →「三印窄陣」→「新演習・潮閘截流」。保留原五題；新演習300結晶、四塔位、十隻甲犬，布塔後整場只能開閘一次，八秒內中段水道行速35%，離水或水流結束即恢復。玩家決定何時讓敵群慢行，並讀本場開閘秒數、進水數與實際累積延遲。中途重載保留倒數與已用次數，戰役錢包隔離。高地圖將唯一編號放在各塔正下方，拉開投影間距避免第三塔遮住圖例；短地圖保留左右排序圖例，兩者均取消跨圖引線。投射物維持亮點與短尾跡。

同一三塔配置、同支出300的公開UI結果：

| 開閘決定 | 真實結果 | 攔下 | 進水數 | 水流累積新增延遲 |
|---|---|---|---|---|
{outcomes}

這是實際玩到的三種結果；不是修改存檔資源、敵軍生命或直接注入勝負。延遲是逐敵逐步累積的水流量，不把冰霜時間混入。

## 最新可用 Muse 五項逐項證據

| 項目 | 本輪驗收與原尺寸截圖 |
|---|---|
| 1．堵隘縮圖、同一前鋒三格 | `docs/content/r12/phone-terrain-barricade-proof-turn-1.png`、`phone-terrain-barricade-proof-turn-2.png`、`phone-terrain-barricade-proof-turn-3.png`。保留同一敵軍ID與各格身寬位移斷言、實際命中、輔助關。64px縮圖存 `qa-64px/`，僅供QA，精選仍是430×932原圖。 |
| 2．水在路上與腳下、計時一致 | `docs/content/r12/phone-terrain-flood-enter-1.png`、`phone-terrain-flood-enter-2.png`、`phone-terrain-flood-enter-3.png`。入水時核對原生減速與顯示腳底；既有逐步測試核對顯示兩位小數誤差小於1/60秒。新潮閘另有 flowing-1／flowing-2、reloaded-flow與flow-ended原圖。 |
| 3．五題敵群最密畫面 | `docs/content/r12/phone-exercise-turn-densest.png`、`phone-exercise-levee-densest.png`、`phone-exercise-switchback-densest.png`、`phone-exercise-split-densest.png`、`phone-exercise-hollow-densest.png`。每0.5秒採樣，保留可見敵軍最多的一格；原全交戰逐幀監測仍驗路面、裁身與半身重疊，沒有放寬斷言。 |
| 4．留守塔身份與拆晶來源 | `docs/content/r12/phone-relay-upstream-hit.png`、`phone-relay-gate-hit.png`、`phone-relay-ford-ice-hit.png`；`phone-relay-crystals-spent-reloaded.png`。地圖留守牌／底環、塔卡來源與級別、拆取90來源及即時餘額都有本輪原圖。 |
| 5．單一編號、對位與短投射 | `docs/content/r12/phone-exercise-turn-formation.png`、`phone-exercise-hollow-failed-clear.png`、`phone-exercise-switchback-combat.png`、`phone-exercise-split-combat-2.png`。高圖唯一圖例與塔腳垂直對位，不再有跨圖標籤引線；短圖圖例按真實左右排序。單元逐座驗相鄰塔遮擋，原UI斷言驗圖例、塔、敵軍互不遮擋。 |

R11原版對照：`docs/content/r12/before/phone-exercise-turn-formation-r11.png` 是Git HEAD原始位元組，與本輪 `phone-exercise-turn-formation.png` 比較，不冒充同版畫面。三分支選擇 `phone-relay-choices.png`、完整第四波 `phone-relay-replay-wave4-combat.png`／`-2.png`、四波完成及返回 `phone-relay-replay-four-waves-complete.png`／`phone-relay-original-return-reloaded.png`，補齊最近評審標示未見的交戰與分支證據。五題成功／同額失敗、替代解及冷載入仍由原回歸操作驗證，原腳本與斷言均保留。

## 測試與畫面交付

**BLOCKED：清理後 `npm run verify` exit1。** 既有 `scripts/audit.mjs` 要讀取相鄰 `tower-defense`／`village-siege` 原作repo，兩者目前都不存在，於 `tower-defense/src/config.js` 報ENOENT。沒有刪除、繞過或放寬該稽核與斷言；完整verify不能宣稱全綠。需要恢復兩個原作repo及其可供比對的Git狀態，才能補驗。`verification/verify.txt`保留原始失敗，`verification/vendored-source-readback.json`僅證明本repo實際保留的{len(vendored['files'])}份原作來源雜湊一致；未封存的原來源條目另列，不冒充原repo即時Git狀態證明。

VERIFIED：中止前已通過原作規則、178項Vitest、建置、R11主套與補證、主流程／RWD、R1與R2美術；中止後依原順序另行完成所有剩餘命令，美術R7、R1～R9與新增R12均exit0，詳見 `verification/continuation.json`。這些分項成功不等於完整verify成功。R11主套 {len(r['checks'])} 項檢查、補證 {len(proof['checks'])} 項、新演習與五題密集補證 {len(new['checks'])} 項；三套均無執行錯誤、無外部請求。新增內容在320×568、430×932、844×390、1032×1376、1376×1032、1366×600、1280×640實際完成並檢查44px可達控制；離線冷載入可完成。

38份原測試／稽核已按Git blob核對原樣，原verify指令完整保留、只追加R12，見 `verification/original-tests-readback.json`。沒有刪測試或放寬舊斷言。

原始完整收據為 `regression-e2e.json`、`regression-proof-e2e.json`、`sluice-e2e.json`，每張截圖含當幀呈現、原尺寸與SHA-256；`capture-index.json`是總索引。精選固定 **15張手機直式430×932原圖**，三項各5張，複製到 `docs/content/r12/review-set/`，依01～15排序；木柵三格、入水兩格、潮閘兩格均為真實連續遊玩狀態，未拼貼、裁切或後製加入額外畫面。

新增商店圖：`docs/store/screenshots/iphone-content-r12-sluice-1290x2796.png`、`docs/store/screenshots/ipad-content-r12-sluice-2064x2752.png`。所有原有商店圖保留並讀回Git基準位元組。三視口複本位於 `docs/evidence/content-r12/`。

{phase}：並發系統負載參考，真實RAF、每跑180格、每情境各三跑。這些是無頭模擬，不是實體裝置或乾淨機認證。

| 情境 | 視口 | 三跑中位p95 | 三跑最大p95 |
|---|---|---|---|
{perf_rows}

秘密掃描零命中；版本在package、lock、campaign、version與README同步0.20.0。建置SHA-256：`{verify['buildSHA256']}`，樣式：`{verify['styleSHA256']}`。

## 美術、清理與風險

新增生成美術 **1張**，實際工具 `image_gen__imagegen`；精確R7風格前綴、完整提示、原圖路徑、尺寸與SHA-256見 `art/manifest.json`。工具未回傳模型slug，照實留null，未冒稱指定模型；未呼叫本機GPU產圖或語言模型。水門是靜態生成原畫，水流由實際狀態驅動，不宣稱閘板有骨架動畫。角色保留原真姿勢圖集。

EXECUTED／VERIFIED：本輪清理 **{clean['count']}個Git已追蹤、已被取代的舊截圖／影片**，原檔合計 **{clean['releasedBytes']/2**20:.2f} MiB**；這是工作樹刪除量，Git歷史與新增本輪證據另計。逐檔範圍、大小與雜湊見 `cleanup.json`。先驗絕對路徑在本repo，先刪604檔再跑完整verify；其外部來源缺件與補跑結果如上。驗證後另將R1本次收據列明的20張舊比較輸出納入清單清除。驗證重生的歷史輸出共移除 {generated['count']} 份，詳見 `verification/generated-output-cleanup.json`，不重複計算釋出空間。這些都是生成輸出，不是測試輸入。保留原畫、mask／rgba／thumbnails等美術稽核輸入、自然達成的存檔JSON、所有Markdown與評審、所有商店圖，以及34個既有未追蹤檔（逐檔雜湊未變）。歷史JSON測試輸出先封存本輪再還原，不把舊報告改成新結果；原作比較輸入 `docs/evidence/before/` 保留。

**Apple 4.3風險：中。** 本作仍是元素塔防；跨戰留塔、戰前改路、限額留空與一次性水流時機共同形成位置與時間的決策，無新增帳號、SDK、廣告、付費、外連或線上功能。評審與平台結果需要獨立判定。

BLOCKED：完整verify缺兩個原作repo；R11 Muse原文缺件；實體iPhone／iPad、真人親子試玩需要設備與參與者；乾淨機效能需安排獨占測試；Muse是否≥8分需後續獨立複審。本輪沒有推送、部署、操作商店、對外傳訊或外部派工。

## 文案修改（speak-human-tw mode2）

| 原句／原呈現 | 原因 | 改成什麼 |
|---|---|---|
| 高圖上方／下方圖例與跨圖引線 | 與塔位距離太遠 | 唯一編號置於各塔腳下；短圖仍依左右排序 |
| 新演習只有既有布陣結算 | 無法說明玩家時機選擇 | 依實際開閘秒數、進水數、累積延遲回饋 |
| 新演習結算同時重複列通用戰報與水流回顧 | 橫式返回鈕被擠出可點範圍 | 保留具體水流回顧，收合重複通用段落 |
'''
text=re.sub(r'`(phone-[^`]+)`',r'`docs/content/r12/\1`',text)
text=text.replace('新潮閘另有 flowing-1／flowing-2、reloaded-flow與flow-ended原圖。','新潮閘另有 `docs/content/r12/phone-sluice-flowing-1.png`、`docs/content/r12/phone-sluice-flowing-2.png`、`docs/content/r12/phone-sluice-reloaded-flow.png`、`docs/content/r12/phone-sluice-flow-ended.png` 原圖。')
text=text.replace('／`-2.png`','／`docs/content/r12/phone-relay-replay-wave4-combat-2.png`')
(root/'docs/CODEX_RESPONSE_CONTENT_R12.md').write_text(text,encoding='utf8')
print('VERIFIED report generated from actual receipts.')
