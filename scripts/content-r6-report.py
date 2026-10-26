"""Write the closeout from verified local artifacts, without inferring test success."""
import json
from pathlib import Path
root = Path(__file__).resolve().parent.parent
read = lambda n: json.loads((root / n).read_text(encoding='utf-8'))
r = read('docs/content/r6/release.json')
e = read('docs/content/r6/e2e.json')
p = read('docs/content/r6/performance.json')
v = read('docs/content/r6/verification-artifacts/npm-verify.json')
ice = read('docs/content/r6/hit-proof.json')
assert all(x['status'] == 'VERIFIED' for x in [r, e, p, v])
link = lambda n: f'[{n}](content/r6/phone-{n}.png)'
text = f'''# 三相邊境｜新內容第 6 輪

VERIFIED：工作單 2026-10-18，執行 2026-10-19，分支 main，版本 **0.14.0**。依 Muse R5 §4 五項驗收完成本機實作與讀回；目標 8 分以上仍待 Muse 複審，沒有自行給分。計畫見 [OPTIM_PLAN_CONTENT_R6.md](OPTIM_PLAN_CONTENT_R6.md)。

| 三項內容 | 入口／怎麼玩 | 本輪完成 |
|---|---|---|
| 攻下一座，留下一塔 | 奪回渡口後選冰塔或拆晶；收復「石脊進軍」後，再選上游火塔、城門火塔或拆 90 結晶，接「不退之地」。 | 第二段有兩個實際塔位，三分支均完成下一場首波、11 隻全攔、耐久 100；選擇與實戰重載皆保留，不能重領。 |
| 戰前改地形 | 每場守城首波前按「戰前工事」，預覽後花 30 結晶堵隘／放水。 | 塌石與木樁封住原路，改走北路；泥水覆在改造土路，入水有水花，北折有轉向記號。原路與新路都在場上可見；遮去浮動文字仍有實戰原圖。 |
| 三印窄陣 | 首頁「三印窄陣・布陣演習」，選題、選元素、點界碑／換塔位、確認後開波。 | 三題擴至五題，新增「雙岸接力」「空哨折道」。分守解法沒有共鳴；後者故意留空第 4 號中央哨。五題皆有同預算勝敗，完成頁列實際主力塔、路段、命中與傷害。 |

命中新增火焰爆裂、冰晶六向結霜、雷擊折線三種形狀；扣血來自真正的傷害事件，包含血條與數字。放大窗直接畫同一名受擊敵兵的當前真姿勢，讓塔後的敵人仍可辨認；可點塔選擇觀察對象。共鳴三角記號只依該發射塔實際加成顯示。火、雷命中不再提前清除冰塔尚未到期的緩速。三種本機合成音效的波形與節奏不同；未宣稱已由真人聽測。

## Muse 五項與原尺寸截圖

1. **命中／扣血／結霜**：火 {link('impact-cannon-before')} → {link('impact-cannon-hit')} → {link('impact-cannon-after')}；冰 {link('impact-frost-before')} → {link('impact-frost-hit')} → {link('impact-frost-after')}；雷 {link('impact-tesla-before')} → {link('impact-tesla-hit')} → {link('impact-tesla-after')}。每組追蹤同一塔、同一目標、同一發投射物；命中差值由引擎讀回，後兩格各前進 140ms、130ms。
2. **第二段接力**：{link('relay-choice')} → {link('relay-upstream-next')} → {link('relay-upstream-hit')}；拆晶入帳 {link('relay-crystals-receipt')}。城門分支另見 {link('relay-gate-next')}、{link('relay-gate-hit')}；兩個留塔位置與拆晶皆完成首波並拍重載圖。上游削弱前段，城門收尾；不是把渡口冰塔搬到新背景。
3. **實戰地形**：放水 {link('terrain-flood-before')} → {link('terrain-flood-after')} → {link('terrain-flood-enter')}；堵隘 {link('terrain-barricade-before')} → {link('terrain-barricade-after')} → {link('terrain-barricade-enter')}。各另有 enter-2、enter-3 連格。這組只抑制繪製標籤，沒有改動敵軍、速度或路線；轉向與入水發生在正常波次，非預覽圖。
4. **五題梯度／同額勝敗**：下表每題四態原圖；失敗圖保留首漏紅圈，勝利圖的策略句與主力路段指出配置差異。
5. **本次決定回顧**：暫停 →「本次決定回顧」，以及每題完成／失敗頁。留塔 {link('report-relay-upstream')}、{link('report-relay-gate')}；拆晶 {link('report-relay-crystals')}；堵隘 {link('report-terrain-barricade')}；放水 {link('report-terrain-flood')}。拆晶採先使用該筆 90 結晶的明示帳目，記實際建塔／升級／工事用途，重試時還原該筆用途額度；不把錢包增加當作已使用。水域延遲按每個敵人的實際入水 dt×(1−0.52) 累計；堵隘列實際在北側新路的敵軍行軍秒數，未冒稱為整場節省時間。

| 題目 | 佈陣 | 交戰 | 完成 | 同預算失敗 | 勝／敗耗用；攔下數 |
|---|---|---|---|---|---|
'''
names = {'turn': '聚印轉角', 'levee': '分守長堤', 'switchback': '折返雙隘', 'split': '雙岸接力', 'hollow': '空哨折道'}
for id, title in names.items():
    a = e['exercises'][id]
    text += f"| {title} | {link('exercise-'+id+'-formation')} | {link('exercise-'+id+'-combat')} | {link('exercise-'+id+'-complete')} | {link('exercise-'+id+'-failed')} | {a['win']['spent']}／{a['loss']['spent']}；{a['win']['kills']}／{a['loss']['kills']} |\n"
text += f'''
## 測試、精選圖與商店圖

VERIFIED：完整 `npm run verify` exit **{v['exitCode']}**，11 個 Vitest 檔、107 項全綠；原 vendor 規則、核心瀏覽器、美術、來源完整性及 R1–R5 內容斷言均保留。R6 **{len(e['checks'])} 項瀏覽器檢查、{len(e['shots'])} 張原尺寸截圖**，包含完成、重載、存檔、五種直橫／iPad 視口、44px 點擊與離線冷重載完成新題。核心 e2e 473 項通過；另以同一正式建置補拍存活敵兵的冰塔連格，{len(ice['checks'])} 項追加檢查通過，76→65、實傷 11，快轉 130ms 的兩次實際 RAF 取樣位移 {ice['actualDisplacement']['distance']:.2f} 世界 px，對應 30px/s（正常為 54px/s）；見 `content/r6/hit-proof.json`。詳細數字與完整 log 在 `content/r6/verification-artifacts/npm-verify.log`，命令、exit code、log／build／style 雜湊在 `npm-verify.json`。

`source dual orders do not advance simulation` 的失敗原因是測試關閉再開啟軍令時，虛擬時鐘仍自動前進，慢機會合法地多跑數個 RAF。現在先固定虛擬時鐘，等待已暫停的官方 UI 狀態與寫回 checkpoint，再對照相同的暫停區間；保留原本 `< .1` 秒斷言，沒有刪除、放寬或改成略過。兩秒暫停仍由真實頁面流程執行。

`content/r6/review-set/` **恰好 15 張**，留塔、地形、窄陣各 5 張，全為 430×932 單次實玩原圖，沒有拼圖、裁切、重採樣或補畫。02–03 為同一發火彈的連格，04 為渡口繼承冰塔對存活敵軍的結霜命中；各項都有遊玩進行中的畫面。原圖對應與複製 SHA-256 見 [REVIEW_INDEX.md](content/r6/REVIEW_INDEX.md)、`release.json`；完整驗收所需的其餘原圖仍在 `content/r6/`，不混入精選資料夾。

新增 `docs/store/screenshots/iphone-content-r6-hollow-1290x2796.png` 與 `ipad-content-r6-hollow-2064x2752.png`。直接用 430×932 DPR3、1032×1376 DPR2 擷取實戰；既有商店圖逐位元組保留。歷史測試重新產生的 484 份證據先 hash 驗證封存，再還原原位元組；完整圖像／影片壓縮檔保留於本機忽略的 `.audit-tmp/content-r6/verification-archives/`，JSON 摘要與收據納入提交，避免把重複歷史圖像加入 repo。收據見 `content/r6/verification-artifacts/receipt.json`；初始 11 份未追蹤 Muse 檔未修改或加入提交。

並發載參考效能：12 跑、每跑 180 個真實 RAF 樣本，放水與空哨折道各測 1366×600／320×568，四組三跑中位 p95 與單跑上限如下。全部單跑須 ≤18ms，沒有以虛擬時鐘量測。

| 場景／視口 | 中位 p95 | 單跑最大 p95 |
|---|---|---|
'''
for a in p['summary']:
    text += f"| {a['scenario']} {a['width']}×{a['height']} | {a['medianP95']:.2f}ms | {a['maxP95']:.2f}ms |\n"
text += '''
美術新增 **2 張生成母版、2 張 runtime WebP**；實際工具 **image_gen__imagegen**，模型 slug 未回傳。提示逐字沿用 R7 stylePrefix；透明 PNG、提示、alpha 與 SHA-256 見 `content/r6/art/`。命中形狀、水花、轉向與放大窗為原生 Canvas；角色沿用真姿勢與深度繪製，沒有新角色出場的宣稱。原 MIT 與第三方素材授權保留。`release.json` 最終秘密掃描為 **0 命中**。

繁中文案依 mode 2 直接校對，本輪修正 3 類：

| 原句／呈現 | 原因 | 改成 |
|---|---|---|
| 三個窄陣，三種取捨 | 題數已擴充 | 五個窄陣，沿路接力 |
| 工事命中一律沿用冰彈／全場共鳴 | 第二段為火塔，且工事未必共鳴 | 依真正塔種與該塔加成顯示 |
| 戰果只有勝敗與剩餘預算 | 無法回看先前決定 | 列實際命中、傷害、路段、拆晶用途與停留秒數 |

## 未完成與風險

**Apple 4.3 風險：中。** 兩段不同用途的工事接力、先改路再排塔、故意留空的固定預算題組與可回看數據，持續建立本作辨識；核心仍是三元素塔防，並不等於平台已判定通過。

BLOCKED：實體 iPhone／iPad 與真人試玩，需要真機及測試人員驗證 Safari 直橫切換、離線冷啟、觸控和聽感；本機模擬無法代替。乾淨機效能亦未驗證。Muse 8 分以上需要獨立複審回報，本次不假稱達標。

本輪只做本機 commit；沒有 push、部署、商店操作、發訊息或外部派工。單一無頭瀏覽器／server 依序執行，用畢關閉。
'''
(root / 'docs/CODEX_RESPONSE_CONTENT_R6.md').write_text(text, encoding='utf-8')
print('VERIFIED closeout generated from release, UI, performance and npm verification receipts.')
