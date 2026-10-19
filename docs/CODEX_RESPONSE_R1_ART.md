# 三相邊境 R1 美術重做結果

2026-10-16，版本 **0.2.0**，本機分支 main。**EXECUTED：美術生成與實際接線；VERIFIED：本機網頁與素材檢查。** 本輪只改 strategy-anthology，未派工、未開可見視窗、未讀秘密、未 push／部署／操作商店。commit hash 以本機 git log 與最後回覆為準。

## 三項主要改變

1. **礦彩山河取代草皮與深綠空帶。** 松林峽谷、雲氣、紅葉與岩層成為主背景。地圖填滿可用區域，角色保留比例；道路與河橋依真實遊戲座標畫在其上。原生邏輯仍是 960×640，沒有為裁切改敵軍路線或碰撞。
2. **三相祭塔、指揮官與東方城鎮建立身份。** 火焰歇山塔、冰棱尖塔、雷環祭塔有不同剪影；地圖與選塔卡使用同一原畫。村鎮、兵營與灰旗據點使用新系列建築。敘事指揮官有明確面孔與三枚塔印，僅用於開場，不宣稱新增可操控角色。戰場單位放大，28 張真幀 atlas 全部補正色彩。
3. **朱砂軍令板取代通用深青圓角卡。** 霧岩色外殼、朱砂按鈕、雕刻框與石墨紋理、元素卡與兵種肖像、行軍印記線形成共同語言。手機隱藏鍵盤說明，核心按鈕維持 ≥44px，章節、暫停、存檔與雙線軍令流程保留。

## 新素材與模型紀錄

**8 張實際生成母版，導出 18 份遊戲用素材；另有 28 張授權原圖的調色衍生 atlas。**

| 母版 | 遊戲接線與輸出 |
|---|---|
| 松林礦彩山河背景 | battlefield.webp；主選單、守城、攻城共用 |
| 火冰雷祭塔圖集 | tower-cannon／frost／tesla.png；地圖與選塔卡 |
| 松林女指揮官 | commander.png／commander-face.png；開場與角色審查縮圖 |
| 軍令板 | panel.webp；控制區與對話框 |
| 三相印章圖集 | seal-cannon／frost／tesla.png；主選單元素印 |
| 三相邊境 Logo | logo.png／wordmark.png；桌面主選單與題字衍生檔 |
| App 圖示提案 | 遊戲用 512／192／64px；1024px 提案在 art/app-icon-proposal.png；PWA／favicon 已接入 |
| 東方據點建築圖集 | keep／barracks／enemy-keep.png；實際守城與攻城 |

實際使用工具：**`image_gen__imagegen`**。要求模型為 gpt-image-2，但工具沒有提供底層 slug，因此 **actualModelSlug=null**，沒有假填 gpt-image-2 或特定 snapshot。提示與固定風格前綴：[PROMPTS.json](art/PROMPTS.json)。原圖、三種見證檔與 runtime 的 SHA-256：[ASSET_MANIFEST_R1.json](art/ASSET_MANIFEST_R1.json)。沿用授權與歷史來源完整保留於 CREDITS、原 manifest 與 vendor 授權文件。

透明輸出有原生 alpha；本輪保留原生 alpha，清理不可見 RGB 與低可見光暈，另存 mask／RGBA／灰底 opaque 合成見證。沒有將不透明黑底或棋盤格當透明，也沒有在不需要時做 matte 反解。採用共用 Wave 0 未修改的 alpha_gate.py 實跑，41 個 RGBA 檔全部通過 magic bytes、格式、尺寸、四角、occupancy、bbox padding、fringe、透明 RGB 與互補暈檢查，見 [alpha-gate.json](art/alpha-gate.json)。

## 審查與前後對照

- 改前嚴格自審：[ART_REVIEW_R1.md](art/ART_REVIEW_R1.md)；方向、HEX、字體、圖示與造型：[ART_DIRECTION.md](art/ART_DIRECTION.md)。收尾盤點發現新增的 [ART_REVIEW_MUSE.md](art/ART_REVIEW_MUSE.md)，已補讀並納入 [逐項對照](art/MUSE_RECONCILIATION_R1.md)；該文件審查的是原版三張 iPhone 圖，本線未呼叫外部模型。
- 同視口、同流程 before／after：`docs/art/compare/before/`、`docs/art/compare/after/`。390×844、844×390、1032×1376 各含 opening／defense／siege。並另有同名左右對照圖，便於快速檢視。
- 最終商店六圖：`docs/store/screenshots/iphone-{opening,defense,siege}-1290x2796.png` 與 `ipad-{opening,defense,siege}-2064x2752.png`。由正式本機建置直接截取，沒有補像素或加虛構畫面；未上傳。
- 64px 縮圖：[contact-64.png](art/thumbnails/contact-64.png)。本線人工檢視可辨弓、盾、法杖、獸首，以及焰冠／冰棱／雷環與三種印章。這是自審，不是盲測或玩家研究。原兵種臉部細節仍受既有 native atlas 限制。

## 測試與品質閘門

| 項目 | 結果與證據 |
|---|---|
| `npm run verify` | VERIFIED；34 項 Vitest、來源 rules 回歸、正式建置、442 項 E2E／33 張截圖、41 項美術實載檢查（含 runtime 與分析檔 hash 綁定）、release audit；`art/verify-r1.txt` |
| RWD 與操作 | VERIFIED；原九視口核心按鈕 ≥44px／可達，另驗 1366×768、1920×1080；十種尺寸 canvas 填滿、無頁面溢出、座標觸控／滑鼠選中正確塔位，手機無鍵盤提示；`evidence/e2e.json`、`art/visual-audit.json` |
| 色彩雙閘 | VERIFIED：28/28；原版 17/28 未過。亮度均值約 0.371–0.487；沿用亮度 0.30–0.75、近黑 <35%、飽和 ≥0.32、低飽和 <20%。明示近黑為 luma<0.12、低飽和為 HSV<0.20、alpha>128 量測；不當成線性光或實機測光 |
| 角色與動作 | VERIFIED：28 張尺寸與 alpha 和原圖相同，六動作列各有四個不同姿勢；未以單張圖晃動代替動畫。規則、impact、取消／命中扣費、存檔、解鎖與兩來源測試均保留 |
| PNG／透明 | VERIFIED：41/41 共用 alpha gate；source／mask／RGBA／opaque／runtime 雜湊可查 |
| 來源與秘密 | VERIFIED：41 個原始來源雜湊、兩來源 repo HEAD／完整 status 不變，授權不變；秘密掃描零命中。當次檔數見最新 `evidence/release-audit.json` |
| 效能 | EXECUTED：1366×600、844×390 各三跑；p95 中位均約 **16.8ms ≤18ms**，見 `evidence/performance.json`。共享機況並發載量測，僅供參考；乾淨機況／真機出貨閘仍 BLOCKED |
| 版本 | VERIFIED：package／lock／campaign／release／PWA 快取為 0.2.0；目前可執行來源無舊版號。歷史報告與改前證據保留 0.1.0 以維持可追溯性 |

前期資產檢查抓到壓縮步驟裁掉低 alpha 像素，已改為保留原 alpha；另有新測試在非觸控 context 誤用 tap，已改為桌機滑鼠、觸控裝置 tap，原斷言不放寬。失敗記錄保留 `art/visual-audit-first.json`、`visual-audit-pointer-first.json` 與 `verify-before-pointer-fix.txt`；最終結論只看上表最新證據。

## 檔案與包體

背景／面板為 WebP，cutout 為真正 RGBA PNG，使用 96／128 色量化前處理後展回 RGBA，角色 alpha 不變。遊戲用新增資產約 **10.04MB**；正式離線資源總量約 **15.1MB**，比原版約 **5.07MB 增加 10.04MB**（十進位，精確值見 release-audit runtime）。主要成本是 28 張全向真 RGBA atlas 與保留原授權 master；完整生成母版、遮罩與比較圖只放 docs，不隨遊戲建置出貨。沒有將原圖刪掉換取較小報表，也沒有把大型 1024px App 提案放進 runtime。

## Apple 4.3 風險：高

視覺模板重複已明顯下降，三祭塔、軍令板、據點與山河背景形成作品身份；這不能證明帳號層級的 4.3 或 4.2.6 已解除。原生包與其他 App 的實際內容／二進位比對、真人 beta、提交者與內容權利證據仍未完成。本輪沒有聯絡 Apple 或操作商店。

## 未完成與風險

1. **BLOCKED：原生與實機。** 無簽署 IPA／AAB、真 iPhone／iPad／Android、原生安全區／升級保留／音訊恢復或乾淨機況效能驗證。
2. **BLOCKED：完整新角色三視圖。** 指揮官目前只有正向敘事立繪；既有 mage／林獸仍是單視角真幀。沒有把 64px contact sheet 冒充全角色三視圖。24 張人類方向 atlas 保留六方向。
3. **PREPARED：改後獨立審查與玩家辨識測試。** 已納入 MUSE 對原版的獨立評語，沒有改後獨立模型結論或真人盲測。MUSE 提出的 5／10 人辨識、ΔE、純色連通區、五秒動態四處與全單位最小 44px 等進階標準沒有完整實測，不宣稱全部達標。預設相鄰三塔仍有自然前後遮擋，但圖示／選塔卡完整可辨；高密度戰鬥可再做人眼體驗測試。
4. **BLOCKED：確切生成 slug。** 工具未揭露，不以 requestedModelSlug 或 C2PA 版本猜測。已完整保存實際工具、提示與原圖證據。
5. **授權／內容邊界。** 沒有新增 3D 模型、兵種、敵人動畫或戰役內容；保留既有真幀與來源授權。美術重做不當成玩法深度或過審保證。

本輪所需本機美術與工程接線已完成；僅建立繁中本機 commit，不推送。
