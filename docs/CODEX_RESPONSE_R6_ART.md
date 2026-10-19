# 三相邊境 R6 美術交付

2026-10-18；main；版本 **0.7.0**；起點 `c20d122587f6cf1d4d79de1fc13c322929104ba1`。

**EXECUTED：17張生成母版、18張遊戲影像與2份幀資料接線。VERIFIED：本機回歸、201項R6守門、六張原尺寸商店圖與九組前後對照。BLOCKED：新的獨立Muse評分、真人3秒盲測及實機效能。沒有宣稱已獲8分。**

僅本機修改與commit，沒有push、部署、商店操作、可見視窗或對外派工，沒有讀取憑證目錄。起點四份未追蹤複審保留原內容及未追蹤狀態，雜湊留在 `docs/art/r6/input-reviews.json`。原有授權完整保留。

## 最大三項視覺改變

1. **三兵種真的重畫。** 先交正側背／表情設定，再交衛士、弓手、術士三套4×6真姿勢；短盾劍、短弓、短披襟法杖收緊輪廓，移除巨型衣擺感。衛士與術士另補站姿受擊，全部存活動作在390寬最小為41.73／42.95／42.73px；中立身高48px，沒有逐幀放大。三兵種與敵我靠造型、色彩分辨，人物完整入鏡。
2. **河谷與橋體直接換畫面。** 保留新原畫的彎曲收放、沙岸與淺灘，不再逐列扭曲岩層。兩座朱砂木欄石拱橋有可見拱腹、橋影、嵌岸岩坡，取代方形平台。兩個未採用橋方案留原檔，不混入出貨數量。我方營地改在左緣取景，騰出工匠與採集點，避免工匠踩在城堡屋頂。
3. **戰況訊號統一。** 甲犬有旗、角甲、雙鞍包三變體及12張真步行姿勢，沿彎曲土路作疏密縱隊，有接觸影與塵土，只有隊長血條。選中塔實線扁橢圓，其餘16%；共鳴成立才畫1.1px細線。全場統一敵紅、我青36×5血條與腳底接觸影；塔卡、兵卡留完整主體與武器安全區。

## RESCORE5 §4 唯一五項驗收

下列為工程驗證與本線看圖自審，**不是新的獨立Muse重評或真人盲測**。所有路徑相對repo，商店圖為原生DPR截圖，沒有補畫、拼貼或放大成規定尺寸。

| 原驗收項目 | 實作與結果 | 改後原尺寸商店圖 |
|---|---|---|
| 1 比例表與攻城單位 | `docs/art/SCALE_SPEC.md`、`docs/art/character-sheets/r6-units.png`及三套新圖集。iPhone人高48、橋面109.09；iPad人高53.31、橋面121.16；兩者人／橋均0.44、塔／人2.33、堡／塔1.8。無字圖證實三職業／敵我可辨，人物無出畫。攻城沒有可建元素塔，塔／堡對照由同尺度的守城圖呈現，未新增圖鑑畫面。 | `docs/store/screenshots/iphone-siege-1290x2796.png`、`docs/store/screenshots/ipad-siege-2064x2752.png`；塔／堡另對照同目錄兩張defense圖 |
| 2 河道、沙岸淺灘與嵌岸橋 | 新原畫有多處彎折與寬窄收放。高俯視橋圖保留拱腹與岩坡，橋面透視切片後占高度70%，不再使用矩形平台。地形單獨截圖已產出；河谷原畫沒有整張扭曲。 | `docs/store/screenshots/iphone-siege-1290x2796.png`、`docs/store/screenshots/ipad-siege-2064x2752.png` |
| 3 敵兵差異、縱隊、接觸影與塵 | 三種大輪廓、四格交替腿、錯開步態與疏密腳印；道路、敵兵與投射物使用一致彎曲視圖投影，原模擬路徑不變。原圖與1/4縮圖能判斷左側進軍方向；隊長單一短血條。 | `docs/store/screenshots/iphone-defense-1290x2796.png`、`docs/store/screenshots/ipad-defense-2064x2752.png` |
| 4 射程與共鳴文法 | 真正點選火塔後只有火塔實線地面橢圓及卡面焦點；其餘16%。單一細實線僅在三相成立時出現，低於道路權重。原160／165／160命中半徑與30%加成未變；橢圓是貼地示意。 | `docs/store/screenshots/iphone-defense-1290x2796.png`、`docs/store/screenshots/ipad-defense-2064x2752.png` |
| 5 落地、血條與卡面取景 | 塔、堡與單位有短冷紫接觸影／壓痕，工匠腳底已離開我方堡的屋頂範圍；所有人完整入鏡守門通過。敵紅、我青同一36×5規格，甲犬只隊長顯示。完整弓、盾、杖與塔體有共同安全留邊。 | 上述兩張defense及兩張siege原圖，並排檢視同一套卡面系統 |

補充原尺寸證據位於 `docs/art/r6/screens/`：`iphone-1290x2796-siege-no-labels.png`、`ipad-2064x2752-siege-no-labels.png`、兩張siege-terrain圖、兩張fire-selected圖。隱去全場文字／血條與移除建築／單位僅影響繪圖，沒有改資源或戰局。

## 新素材與模型

實際工具 **`image_gen__imagegen`**；工具未回傳底層模型slug，`actualModelSlug=null`，不推測為指定gpt-image版本。全部提示使用 `docs/art/PROMPTS_R6.json.stylePrefix`，合併在 `docs/art/PROMPTS.json.sixthRound`。

| 類別 | 生成母版 | 實際接線 |
|---|---:|---|
| 三職業正側背／表情設定 | 1 | `docs/art/character-sheets/r6-units.png`，僅設定參考；下緣建築草圖不作尺寸正本 |
| 河谷地形 | 1 | `public/assets/r6/ford.webp` |
| 拱橋方案 | 3 | 1張出貨為`bridge.png`，2張未採用原檔留存 |
| 三職業完整真姿勢 | 3 | `warrior.png`、`archer.png`、`mage.png`與`actor-frames.json` |
| 衛士／術士站姿受擊修正 | 2 | 合入上述圖集的受擊列，各四張真姿勢，共用該列固定尺度 |
| 三變體甲犬步行 | 1 | `hound-walk.png`、`hound-frames.json`；其他受擊／倒地保留R5 |
| 三職業完整武器肖像 | 1 | 三張`*-portrait.png` |
| 礦紙面板、三相印、指揮官、Logo、App圖示 | 5 | 1張WebP面板、3張印、角色／Logo各1張及64／192／512圖示 |

共17張母版，其中14張用於出貨、1張設定表、2張淘汰橋方案；導出18張影像及2份資料。來源、RGBA、mask、灰底檢查圖、64px縮圖都有SHA-256，見 `docs/art/ASSET_MANIFEST_R6.json`。來源生成alpha保留並清除低alpha／透明RGB；新角色、肖像及甲犬八張成品全過原亮度0.30–0.75、近黑<35%、飽和≥0.32、低飽和<20%門檻，28張歷史MIT圖集重新量測亦全過。沒有以染色稱為新角色。

## 前後對照與測試

- `docs/art/compare/r6/before/`與`after/`：390×844、844×390、1032×1376的開場、守城、攻城，共九組。並排圖在`docs/art/compare/r6/`，SHA-256綁定於`docs/evidence/art-r6-release.json`。
- `docs/store/screenshots/`：開場、真投射動作守城、三兵種攻城，各兩種原尺寸，共六張。1/4縮圖在`docs/art/r6/thumbnails/`。
- `npm run verify`：49項Vitest與vendor規則全綠；442項E2E、41項視覺、114項R2守門通過。含觸控取消、44px命中區、十視口、選單關閉、離線與存檔。
- R3／R4／R5額外美術回歸：83／108／117項通過，六章皆公開UI正常完成。R3修正勝利瞬間DOM切換的操作競態；R5等待可見的混合步態投射瞬間取樣，原斷言沒有刪除或放寬。
- R6：201項來源／遮罩／圖集／比例／選取／接地／完整入鏡／商店畫面守門通過。實時六張戰鬥圖、影片入口與最終build/style雜湊見`docs/art/r6/visual-audit.json`。
- 效能已執行三跑中位：1366×600與844×390的p95皆 **16.8ms**，低於18ms參考線。這是並發載Chromium的RAF間隔，不是清機或實體iOS出貨認證；`performance.json.releaseGate`保留BLOCKED。
- 新版入口與快取0.7.0，依賴版本條件保留原值；秘密掃描零命中。完整輸出為`docs/art/verify-r6.txt`、`docs/art/test-r3-under-r6.txt`、`docs/art/test-r4-under-r6.txt`、`docs/art/test-r5-under-r6.txt`、`docs/art/test-r6.txt`、`docs/art/perf-r6.txt`。
- `.gitattributes`沿用R5的位元組保留方式，避免Windows換行轉換破壞幀資料／收據。Git暫存區118份素材相關檔及113份封存證據均與manifest雜湊一致；沒有只檢查工作目錄。詳見`docs/art/r6/staged-integrity.json`。

## 包體、風險與缺件

新增runtime素材 **6,907,435 bytes**；完整dist **40,397,854 bytes**，相對0.6.0增加 **6,911,353 bytes（20.64%）**。背景／面板用WebP，透明圖集、卡圖與cutout用適當尺寸真RGBA PNG；授權與原素材保留。比較圖、生成母版與稽核影片不在dist。

**Apple 4.3風險：中。** 礦彩河谷、朱砂軍令、三相塔印與職業／敵軍形狀已有專屬組合；美術差異不等於平台已解除同質化判定。新的Muse 8分以上評分尚未取得，不能把本線自審當獨立評分。

未完成／限制：真人3秒盲測、實體iPhone／iPad及清機效能未做；低矮橫式仍會壓縮橋面透視，不能把它作完整比例驗收。自然沙岸／淺灘是視覺地貌，原矩形深水核心與通行判定保留；沒有擴張地形或尋路系統。左向角色是鏡像衍生，沒有宣稱新增六向原畫。所有最終證據以`docs/evidence/art-r6-release.json`綁定的商店圖及`docs/art/r6/visual-audit.json`為準。
