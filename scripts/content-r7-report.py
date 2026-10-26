"""Write the Chinese handoff only from completed local receipts."""
import json
import re
from pathlib import Path

root=Path(__file__).resolve().parent.parent
read=lambda n:json.loads((root/n).read_text(encoding='utf-8'))
r=read('docs/content/r7/release.json');e=read('docs/content/r7/e2e.json');p=read('docs/content/r7/performance.json')
v=read('docs/content/r7/verification-artifacts/npm-verify.json')
assert r['status']==e['status']==v['status']=='VERIFIED' and v['exitCode']==0
log=(root/'.audit-tmp/content-r7/npm-verify.log').read_text(encoding='utf-8',errors='replace')
unit=re.search(r'Tests\s+(\d+) passed',log);assert unit
shots=lambda names:'、'.join(f'`docs/content/r7/phone-{n}.png`' for n in names)
text=f'''# 三相邊境｜新內容 R7 交付

VERIFIED：2026-10-19，v{r['version']}。依 `CONTENT_REVIEW_R6_MUSE.md`「下一輪最該做的 5 件事」完成本機修改與驗收。三項內容各有實際觸控操作、完成及存檔測試；未推送、部署、操作商店或對外派工。Muse 8 分以上仍待獨立複審，不能以本次自驗代替。

## 三項內容與正常入口

1. **攻下一座，留下一塔**：石脊攻城勝利頁，三張小地圖同時顯示下一場的塔位、射程與可打路段。上游先削前段，城門補最後一段，拆晶建議在中段補火塔；去除玩家介面的座標。繼承火塔換上修補石基與舊戰旗。渡口冰塔接力持續保留。
2. **戰前改地形**：守城第一波前 →「戰前工事」。放水的水面、泥岸及流向更明確；入水敵軍同時有水花、52% 行速與個別累積延遲秒數。堵隘放大塌石木樁並標示封閉。正常戰場「輔助」能關閉箭頭、地圖註記與底部提示，地形與狀態仍可辨識。
3. **三印窄陣**：首頁 →「三印窄陣」，或戰前工事 →「先試三印窄陣」。五題保留原固定預算、不同路形與界碑限制；選元素、換塔位、點界碑、確認付款都有實際操作證據。失敗頁列出真正第一隻漏敵、當時生命與漏點路段，並對照該題解題句。

守城暫停 →「本次決定回顧」，以及守城完成頁，皆可進入「換另一分支重打本場」。重演保留本章全部波次，使用獨立餘額，能重載接續，不重領戰役獎勵。比較表明示採**相同首波**，並排列選項、花費／拆晶、主力塔、實際路段、傷害／攔下數、新路敵軍數與涉水延遲；原戰局與共用錢包不變。

## 唯一驗收清單與原尺寸截圖

### 1．三分支可比較

VERIFIED：經正常匯入介面載入 R6 真實攻城取得的石脊勝利存檔，分別操作三個分支；三者都完成下一場首波，守城耐久 100、攔下 11 隻。實際匯入存檔副本保存在 `docs/content/r7/verification-artifacts/historical/docs/content/r6/attained-quarry-save.json`，SHA-256 與 e2e.json 相符。三分支各有同規格「選擇 → 首波命中 → 決定回顧」：

'''
for choice in ['upstream','gate','crystals']:
    text+=f"- {choice}："+shots([f'relay-{choice}-choice',f'relay-{choice}-hit',f'relay-{choice}-review'])+'。\n'
text+='''
拆晶重載後不能重領，分支與下一場開局保留；證據為 `phone-relay-crystals-claimed.png`、`phone-relay-crystals-reload-receipt.png`、`phone-relay-crystals-next.png`。城門、上游各另有 `before/hit/after` 三格，均存於 `docs/content/r7/`，同一發來源塔及目標可由 e2e.json 的 frame 讀回。

### 2．地形不靠輔助線

VERIFIED：下列圖片以正常「輔助：關」擷取，沒有路線箭頭、地圖註記或底部提示。

'''
for choice in ['flood','barricade']:
    text+=f"- {choice} 改前／改後："+shots([f'terrain-{choice}-before',f'terrain-{choice}-after'])+'。\n'
    text+='- 同一段實際入區連續三格：'+shots([f'terrain-{choice}-enter-{i}' for i in [1,2,3]])+'。\n'
text+='''
放水拍到敵軍已進水面，非停在入口；水花、52% 與每隻累積延遲同時顯示。回顧以模擬事件累計實際入水／北繞敵數及秒數，不從勝利推算。兩項回顧見 `phone-terrain-flood-review.png`、`phone-terrain-barricade-review.png`。

### 3．五題選位與同額失敗

VERIFIED：每題皆以火、冰、雷透過按鈕及界碑實際布陣；選位圖保留最後一塔待確認的元素、界碑與射程。`phone-exercise-<id>-moving.png` 另記錄「換塔位」的當下。五題各有以下四態，檔案均位於 `docs/content/r7/`：

| 題目 | 選位 | 交戰 | 完成 | 同額失敗 |
|---|---|---|---|---|
'''
for id,name in [('turn','聚印轉角'),('levee','分守長堤'),('switchback','折返雙隘'),('split','雙岸接力'),('hollow','空哨折道')]:
    text+='| '+name+' | '+' | '.join(f'`phone-exercise-{id}-{s}.png`' for s in ['formation','combat','complete','failed'])+' |\n'
text+='\n每題另有 `phone-exercise-<id>-losing-formation.png`。勝敗支出相同：'
text+='、'.join(f"{name} {e['exercises'][id]['win']['spent']}" for id,name in [('turn','轉角'),('levee','長堤'),('switchback','雙隘'),('split','雙岸'),('hollow','空哨')])+' 結晶，餘額皆 0。失敗由實際第一隻越線敵軍觸發，耐久 88；沒有改血量、預算或結果來做對照。五題皆完成進行中重載及完成紀錄保存，戰役錢包不受影響。\n'
text+='''
### 4．命中回饋可讀

VERIFIED：命中窗改為戰場下方／側欄的獨立軍令欄，可按「切換」觀察塔，不遮擋敵軍。每次命中分開列出來源塔與敵軍、基礎＋共鳴＝威力、實扣、前後生命、結霜層數及剩餘秒數。共鳴三角只標示實際享有加成的塔；雷印以折線電弧表達既有單體命中，未冒稱新增連鎖傷害。

'''
for element in ['cannon','frost','tesla']:
    text+='- '+element+' 同一發前／中／後：'+shots([f'impact-{element}-{s}' for s in ['before','hit','after']])+'。\n'
for element in ['cannon','tesla']:
    text+='- '+element+' 命中仍保留冰霜的連續三格：'+shots([f'impact-{element}-retains-frost'+suffix for suffix in ['', '-2', '-3']])+'。\n'
text+='''
三種既有本機合成音色維持原樣，單元檢查波形類型各異；沒有宣稱靜態截圖能證明聽感差異。聽感驗收列為 BLOCKED，需要實際試聽。

### 5．可比較、可重打

VERIFIED：`docs/content/r7/phone-relay-replay-compare.png` 並排上游實戰與城門重演的同一首波；`phone-terrain-replay-compare.png` 並排放水與堵隘的實際敵數與延遲。`phone-relay-full-complete.png`、`phone-relay-complete-replay-entry.png` 證明完成頁有重打入口，`phone-relay-replay-reloaded.png` 證明重演能重載接續。城門重演實際完成本章四波；前後共用結晶、拆晶來源帳與原戰局由測試逐值比較，不發獎勵、不多扣錢。

## 測試與素材

'''
text+=f"VERIFIED：`npm run verify` exit 0，{unit.group(1)} 項單元測試；既有主流程、美術及 R1–R6 內容檢查均保留並通過；R7 {r['uiChecks']} 項 UI 斷言、{r['originalScreenshots']} 張原尺寸擷取。包含五題勝敗、三分支首波、完整守城重演、存檔重載與離線冷啟後完成演習。沒有新增外部請求或執行錯誤。\n\n"
text+='''手機 320×568／430×932、橫式 844×390、iPad 1032×1376／1376×1032 檢查了可達按鈕、至少 44px 觸控目標、無頁面溢出及手機無鍵盤提示。窄版塔卡調整後重新驗證；命中欄與戰場分開。此為無頭觸控模擬，沒有冒稱實體裝置測試。

回歸亦補齊既有雙印 10% 共鳴的存檔相容性；轉角與折返的分散替代解都實際獲勝並保存。三印 30%、雙印 10% 與無加成分別顯示，沒有改動原傷害規則。舊版進行中投射物也能繼續命中並保存。

精選資料夾 `docs/content/r7/review-set/` 共 **15 張 430×932 原圖**，三項各 5 張；07–09 為入水連續三格，12 含雷印命中與折線。原檔逐位元組複製，沒有拼圖、裁切、縮放或補畫。索引為 `docs/content/r7/REVIEW_INDEX.md`。

新增商店原圖：`docs/store/screenshots/iphone-content-r7-flood-1290x2796.png`、`docs/store/screenshots/ipad-content-r7-flood-2064x2752.png`；以對應 DPR 實際擷取，既有商店圖逐檔雜湊確認未變。

新增美術 **2 張**（繼承火塔、涉水地表），實際工具 `image_gen__imagegen`，模型 slug 未回傳。固定前綴、母版、透明 alpha、裁切與雜湊見 `docs/content/r7/art/`；執行素材為 `public/assets/content-r7/`。既有授權保留。

'''
text+=f"{p['status']}：並發系統載量下的真實 RAF 量測，12 次、每次 180 格；各情境／視口最大 p95 為 "+'、'.join(f"{x['scenario']} {x['width']}×{x['height']}：{x['maxP95']:.2f}ms" for x in p['summary'])+'。18ms 為本輪參考門檻；不是實機或乾淨機效能保證。詳見 `performance.json`。\n\n'
text+=f"VERIFIED：秘密掃描 {r['secretScan']['files']} 個版本控制可見路徑，零命中。驗證與發行建置 SHA-256：`{r['buildSHA256']}`。歷史測試重跑輸出先封存，原始證據還原；本輪可攜 JSON 摘要與收據在 `verification-artifacts/`，完整歷史圖／影片重跑留於忽略的 `.audit-tmp/content-r7/verification-archives/`。12 份初始未追蹤 Muse 文件逐檔雜湊保留。\n\n"
text+='''## 文案修改摘要（speak-human-tw mode 2）

| 原句 | 原因 | 改成什麼 |
|---|---|---|
| 留火塔・上游長路（456,264） | 座標無法協助玩家判讀 | 留上游火塔／先削前段，提早開火，搭配實際地圖覆蓋 |
| 第一隻敵軍已越線，立即結束。固定預算全數還原後可重排。 | 缺少可用的失敗線索 | 首漏敵軍、漏點路段、當時生命，接上該題解題句 |
| 94→68 −26 | 數字缺欄位名稱 | 基礎＋共鳴＝威力；實扣／生命前後／結霜剩餘分行顯示 |
| +4 | 演習及重演沒有結晶獎勵，浮字會誤導 | 演習與重演顯示「攔下」，戰役實際發晶時保留 +4 |
| 上游長路 | 零命中時不可預設主力路段 | 未命中 |

## 未完成與風險

**Apple 4.3 風險：中。** 跨場留塔、先改路再排塔、固定預算留空解題及完整守城重演，使本作特色更清楚；核心仍是三元素塔防，平台判定仍需正式審查。沒有新增廣告、內購、帳號、第三方 SDK、外部連結或線上玩法。

BLOCKED：實體 iPhone／iPad 的直橫切換、觸控及離線冷啟，需要真機與測試人員；真人試玩、音效聽感需要實際參與者；乾淨機效能需要不受其他線路影響的設備；Muse 8 分以上需要獨立複審。這些沒有假造結果。本輪沒有留待補做的本機玩法修改。
'''
(root/'docs/CODEX_RESPONSE_CONTENT_R7.md').write_text(text,encoding='utf-8')
print('VERIFIED handoff report written')
