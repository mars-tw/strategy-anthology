# 三相邊境 R5 美術交付

2026-10-18，main，版本 **0.6.0**。**EXECUTED：17 張生成母版及遊戲接線。VERIFIED：本機回歸、五項畫面證據與商店重拍。BLOCKED：新獨立 Muse 評分、真人盲測與實機驗證。** 只做本機修改與 commit，沒有 push、部署、操作商店、可見視窗、外部派工或讀取憑證目錄。起點既有三份未追蹤 Muse 複審保留原內容與未追蹤狀態。

起點 commit：ebc19d6f6a987d73294d8bf77247f394f0247dd6。八面向與五項清單的範圍見 OPTIM_PLAN_R5.md；開源技法研究見 art/STUDY_R5.md。

## 最大三項視覺改變

1. **比例先行的場上人物。** 先寫 SCALE_SPEC.md，再交五職業正側背表與六套真姿勢。人類共用 48–54px 中立身高，塔 2.33 人高、主堡 1.8 塔高，橋面淨寬為人高／0.44。建築按可見 alpha bbox 畫，攻擊、倒地不再依單幀外框拉大。
2. **河谷渡口與有個體差異的敵軍。** 新原畫有兩次以上彎折與寬窄收放、沙岸、淺灘、入水階；寬橋兩端嵌岸並補橋影。棕色軍令只過陸岸與橋面。甲犬使用旗、角甲、背包三種固定配件，錯開真步行幀與腳下位置，只有隊長顯示血條。
3. **圖像主導的三相軍令。** 塔卡改成鳳焰、冰晶、雷環大特寫，與大臉武器兵種卡同規格。選中塔顯示單一實線扁橢圓，未選中 alpha 約 0.16；共鳴成立才畫亮紫實線。紙框保留朱砂切角，開場文字加暖墨承托。

## Muse RESCORE4 §4 唯一五項驗收

以下為本線自審與確定性驗證，**不是新的獨立 Muse 評分或真人盲測**。路徑均相對 repo；兩種商店圖為未拼貼原尺寸截圖。

| 原清單項目 | 本輪做法與驗收證據 | 改後原尺寸截圖 |
|---|---|---|
| 1 先交比例表，再重繪攻城單位 | SCALE_SPEC.md、character-sheets/r5-units.png；五種人類同中立尺度，朱紅盾／青瓷弓／藤紫杖對鈷藍尖盔分辨敵我。人高／橋面 0.44，無單位比橋面寬。無字無血條圖另交，沒有以河流跨度冒充橋面淨寬 | docs/store/screenshots/iphone-siege-1290x2796.png；docs/store/screenshots/ipad-siege-2064x2752.png；docs/art/r5/screens/iphone-1290x2796-siege-no-labels.png；docs/art/r5/screens/ipad-2064x2752-siege-no-labels.png |
| 2 重做河道形狀 | 新原畫整張地表對岸線做逐列貼合，岸寬 156.0–264.8 世界 px、中心擺幅 159.2px，沙／淺灘／階與橋影可見。去除白色跨水虛線，純地形遮掉全部建築與單位 | docs/art/r5/screens/iphone-1290x2796-siege-terrain.png；docs/art/r5/screens/ipad-2064x2752-siege-terrain.png；上述兩張攻城商店原圖 |
| 3 敵兵三種個體差異與行進感 | 甲犬旗／角甲／背包依 ID 固定，步態相位、橫縱腳印錯落；足下壓痕、接觸影與塵土，僅隊長血條。商店圖取正常開波真實飛彈瞬間；四分之一縮圖同交，不把多張同姿蓋印算完成 | docs/store/screenshots/iphone-defense-1290x2796.png；docs/store/screenshots/ipad-defense-2064x2752.png；docs/art/r5/thumbnails/iphone-defense-1290x2796-quarter.png；docs/art/r5/thumbnails/ipad-defense-2064x2752-quarter.png |
| 4 收斂射程與共鳴 | 選中塔實線扁環，高／寬 0.32；未選中低於 20%。成立才畫同一亮紫實線。選塔本體、卡片與元素印一致。原世界 160／165／160 命中半徑不變，地面環是示意，非精確碰撞遮罩 | docs/art/r5/screens/iphone-1290x2796-fire-selected.png；docs/art/r5/screens/ipad-2064x2752-fire-selected.png；docs/art/r5/screens/iphone-1290x2796-defense-no-labels.png；docs/art/r5/screens/ipad-2064x2752-defense-no-labels.png；兩張守城商店原圖 |
| 5 塔卡特寫與全體落地 | 火焰／冰晶／雷環占塔卡主要畫面；塔、單位、建築均有接觸影／壓痕。三塔無名圖可看形狀辨識，人物設定表與 64px 剪影同交 | 兩張守城商店原圖；docs/art/r5/screens/iphone-1290x2796-defense-no-labels.png；docs/art/r5/screens/ipad-2064x2752-defense-no-labels.png；docs/art/r5/thumbnails/unit-lineup-silhouette.png |

RESCORE3 同樣點名的比例、河道、貼地範圍與落地陰影在以上五項內處理。已通過的朱砂紙本識別、無大面積死區保留。沒有新增系統、章節、技能或畫面，也沒有用其他改動替代五項清單。

## 素材、工具與授權

**EXECUTED：17 張生成母版 → 26 張執行圖片＋2 份 metadata。** 實際工具 **image_gen__imagegen**，工具未回傳底層模型 slug，`actualModelSlug=null`；不冒稱特定 gpt-image 型號。

- 正側背五職業設定表 1；衛士、弓手、術士、敵兵、工匠、甲犬各 1 套 4×6 真姿勢，共 6。
- 河谷地表 1；橋 2（第一版過窄，保留原稿、未上線）；三配件同頁 1。
- 女將、塔卡特寫、三元素圖示、面板、Logo、App 圖示提案各 1。

共同前綴、實際透明參數與參考圖 hash 在 PROMPTS_R5.json，已合入 PROMPTS.json.fifthRound。母版在 r5/sources，清理後 RGBA 母版、alpha mask、灰底合成見證在 r5/rgba、masks、opaque；來源／衍生／執行檔 SHA-256 在 ASSET_MANIFEST_R5.json。PNG／WebP 格式符合實際 magic bytes，21 張 RGBA 執行圖四角透明。Pillow 僅裁切、固定縮放、色彩調整與壓縮；沒有程序化人物或單圖移動補動作。

六套新圖集與女將 7／7 通過亮度／飽和雙閘門；保留的 28 張 MIT 圖集重新量像素也為 28／28。每列 4 個不同繪製姿勢，攻擊保留預備／命中／復位，傷害仍在原第三格／0.20 秒，受擊、死亡播放完整。新原畫僅一個右向 3/4 方向，左向鏡像是衍生。沒有冒稱六方向重畫。

原 MIT 美術、授權與來源雜湊未改。CREDITS 已增補本輪來源；Wesnoth 僅技法研究，未複製其素材。

## 測試、截圖與包體

最終數據見 docs/art/verify-r5.txt、test-r3-under-r5.txt、test-r4-under-r5.txt、test-r5.txt、perf-r5.txt、docs/evidence/art-r5-release.json、art-r5-index.json。歷史 R1–R4 畫面被守門重拍後，先保存本輪副本與 hash 至 r5/legacy-checks，再恢復歷史圖；不把本輪畫面覆寫成歷史證據。

| 驗證 | 結果 |
|---|---|
| npm run verify | VERIFIED：來源 rules 全綠、Vitest 49／49、E2E 442、既有美術 41＋114；41 份來源 hash、2 個來源 repo 狀態保留；秘密掃描零命中 |
| npm run test:art:r3 | VERIFIED：83 項，六章正常 UI 通關 |
| npm run test:art:r4 | VERIFIED：108 項，兩種商店尺寸與真實時鐘動態 |
| npm run test:art:r5 | VERIFIED：117 項，17 母版／28 執行檔 hash、7＋28 色彩閘門、三配件、隊長血條、比例、陸橋路徑、無字／純地形、原尺寸商店圖與動作 |
| npm run test:perf | EXECUTED：1366×600、844×390 各 3 跑，每跑 180 幀；p95 三跑中位皆 16.8ms，≤18ms 參考值。並發機況，實機／乾淨機況出貨閘仍 BLOCKED |

九組同流程前後在 docs/art/compare/r5/before、after（390×844、844×390、1032×1376，各開場／守城／攻城），同名根目錄圖為左右對照。商店六張在 docs/store/screenshots，分別 1290×2796、2064×2752，各開場／守城／攻城。全部為無頭 Chromium 模擬視口／DPR，沒有冒稱實體 iOS 或原生包。

原測試未刪除或放寬。R4 視覺守門只把兵種卡資產路徑斷言由 /r4/ 更新為 /r5/，保留三張卡、≥60px、所有來源 hash、比例與操作斷言。新加 R5 比例／橋上路徑／敵軍變體測試。放大塔體後補上原塔位精確命中，避免點原塔位誤選另一座塔身。

提交讀回另檢出 Git 換行正規化會改變兩份新 metadata 的 bytes；已在 .gitattributes 延伸原有 R4 的 hash 保護，保留 R5 metadata 與驗收收據的原始位元組。提交 blob 與 manifest／歷史收據逐檔核對，不只核對工作樹。

本輪執行素材 **4,899,438 bytes（約 4.67 MiB）**；完整 dist **33,486,501 bytes（約 31.94 MiB）**，比 0.5.0 增加 **4,905,420 bytes／17.16%**。母版、設定表、影片與報告不進 runtime。保留歷史資產以維持授權與回歸，沒有靠刪舊圖壓增量。

## Apple 4.3 與未完成

**Apple 4.3 風險：中。** 三相元素塔卡、朱砂軍令與河谷渡橋有專屬識別；平台尚未重新審查，玩法／同帳號內容相似性仍需平台判定。

**BLOCKED／未完成：** 本輪禁止外部派工，沒有新 Muse 獨立複評，不能宣稱已達 8 分；真人三秒／無字辨識盲測、實體 iPhone／iPad、乾淨機況效能未做。矮畫面尤其 320×568 的寬橋與建築仍較擁擠；人物只有一個原畫方向加鏡像；女將是靜態立繪；後三章沿用既有地景。射程環是示意，不是碰撞遮罩。這些限制沒有算作已完成驗收。

本機 commit hash 見最終回覆；沒有 push。
