# 三相邊境 R4 美術交付

2026-10-18，main，版本 **0.5.0**。**EXECUTED：19 張生成母版與遊戲整合。VERIFIED：本機工程／畫面驗收。BLOCKED：新的獨立 Muse 8 分評分、真人盲測與實體裝置驗證。** 本輪未 push、部署、操作商店、開可見視窗、外部派工或讀取憑證目錄。工作區沒有 prompt.md，依本對話完整工作單執行。起點 `d5334beb2b283785fbb6ad78d88b6b708ea2912b`；原先未追蹤的兩份 Muse 複審保持原內容與未追蹤狀態。

## 最大三項視覺改變

1. **有共同身份的兵種。** 先製作女將與四職業／陣營正側背設定，再畫六套真姿勢。衛士以朱砂圓盾、弓手以青瓷彎弓、術士以藤紫分叉杖辨識；灰旗兵以尖盔／鳶盾、甲犬以四足藍甲分家。工匠改短身＋鎬，卡片改大臉與武器半身圖。
2. **河谷與道路真正換原畫。** 暖松林、冷板岩河谷為兩張獨立俯視地表；自然河道保留沙岸、淺灘、蘆葦、石塊與高光，再貼合原深水核心與兩個渡點。道路用有草肩、車轍、碎石的透明原畫 strip 沿原路徑繪製，轉角圓滑收放。
3. **三相資訊變輕，塔落到地上。** 三塔重畫深石方基與接地陰影，移除原圖白盤。選中塔的卡片、基座與貼地範圍環同步，只保留一種藤紫共鳴線；大白牌改小型元素印／扁環／三角／+30% 圖例。乾淨紙心與石線框延續朱砂軍令識別。

## 最新 Muse 五項唯一驗收

下列是本線自審與工程驗證，**不是新的獨立評分，也沒有真人 3 秒測試**。所有證據路徑相對 repo；商店原圖未拼貼或縮放。

| Muse §4 原項目 | 完成內容與驗收範圍 | 改後原尺寸截圖 |
|---|---|---|
| 1 比例表與攻城單位 | VERIFIED：`docs/art/character-sheets/SCALE_R4.md`、`r4-commander.png`、`r4-unit-lineup.png` 先鎖定；人類同視口相同可見身高，iPhone 商店視口 53.15 CSS px、iPad 60px；工匠、三職業、灰旗兵均用新圖。無標籤版本可自審盾／弓／杖、紅青紫友軍與鋼藍敵軍 | `docs/store/screenshots/iphone-siege-1290x2796.png`；`docs/store/screenshots/ipad-siege-2064x2752.png`；`docs/art/r4/screens/iphone-1290x2796-siege-no-labels.png`；`docs/art/r4/screens/ipad-2064x2752-siege-no-labels.png` |
| 2 道路與河流形狀 | VERIFIED：道路草肩與車轍來自新原畫，寬度／磨損自然變化，64 世界 px 轉角緩衝；河岸跨度 180–280 世界 px、中心擺幅 154.70px，深水核心包含 x450–560；沙岸淺灘蘆葦、嵌岸橋頭與橋影。純地形圖移除單位、建築、地名與卡名 | `docs/art/r4/screens/iphone-1290x2796-defense-terrain.png`；`docs/art/r4/screens/iphone-1290x2796-siege-terrain.png`；`docs/art/r4/screens/ipad-2064x2752-siege-terrain.png`；上述兩張攻城商店原圖 |
| 3 敵人成為第二主角 | VERIFIED：藍甲灰旗犬高度約為一般人的 1.22 倍，有陣營邊光、橢圓接地影、至少 36×5px 血條，腳下塵土與向右行走姿勢表現方向。守城商店圖由正常開波捕捉真實飛彈瞬間，1/4 縮圖仍可指出左上敵軍隊列與方向 | `docs/store/screenshots/iphone-defense-1290x2796.png`；`docs/store/screenshots/ipad-defense-2064x2752.png`；對應 `docs/art/r4/thumbnails/iphone-defense-1290x2796-quarter.png` 與 `ipad-defense-2064x2752-quarter.png` |
| 4 收斂三相視覺文法 | VERIFIED：只強調被選塔的貼地環，其餘低透明；卡片、基座、元素印同步，點火塔會只選火塔；共鳴僅一種藤紫虛線與小三角，生效 +30%。移除大白牌。射程是貼地示意，高／寬 0.40，**命中仍依原世界 160／165／160 半徑，不能把示意環冒稱等比例碰撞區** | `docs/art/r4/screens/iphone-1290x2796-fire-selected.png`；`docs/art/r4/screens/ipad-2064x2752-fire-selected.png`；兩張守城商店原圖 |
| 5 武器半身卡與塔落地 | VERIFIED：三張卡取自同身份新原畫，盾、彎弓、分叉杖與臉共同占主要空間。塔圖使用新的深石方基／石階／碎礫，配土壓痕與投影；手機村莊約 98px、塔 64px，與 48–60px 一般單位共同採軍用微縮沙盤比例 | `docs/store/screenshots/iphone-siege-1290x2796.png`；`docs/store/screenshots/ipad-siege-2064x2752.png`；`docs/art/compare/r4/after/390x844-defense.png`；`docs/art/compare/r4/after/1032x1376-defense.png` |

對照 RESCORE2：自然岸線／道路、巨型工匠、首兩章山景重用、共鳴線混色與紙紋干擾均在這五項內收尾。開場保留敘事山景，守城改俯視松林、攻城改板岩河谷，不再以同一山峰換道具。主要文字五類對比仍通過原 R3 ≥4.5:1 檢查。

## 新素材、模型與後製

**19 張生成母版 → 26 張遊戲圖片＋1 份 frame metadata。** 實際工具 **`image_gen__imagegen`**；工具未提供底層模型 slug，`actualModelSlug=null`，不猜型號。沒有 API／CLI fallback 或外部圖庫。

- 2 張設定表：女將，四職業／陣營正側背與表情。
- 6 張六動作圖集：衛士、弓手、術士、灰旗兵、工匠、甲犬，各 4×6 真姿勢。
- 2 張俯視地表、1 張河道 cutout、1 張道路 strip。
- 女將立繪、元素圖示 atlas、紙框、Logo、App icon 提案、三塔 atlas 各 1。
- 1 張三職業攻擊補繪 atlas，修正伸出武器被格界切掉的問題；完整剪影裁切另保留甲犬頭部與衛士長劍。

所有新圖使用同一風格前綴、左上光、暖墨描邊與礦彩色面，提示及來源見 `docs/art/PROMPTS_R4.json`，並合入 `PROMPTS.json.fourthRound`。19 張原圖均在 repo 內。原生 alpha 保留、低 alpha 清理，mask 與灰底見證在 `docs/art/r4/masks/`、`opaque/`；PNG／WebP 尺寸、雜湊與色彩見 `ASSET_MANIFEST_R4.json`。WebP 解碼後透明區隱藏 RGB 可非零，沒有冒稱所有壓縮像素均清零，實際合成以灰底見證檢查。

六套新 atlas 與女將 **7／7**、既有 atlas **28／28** 通過亮度／飽和雙閘門。新 atlas 六列皆含四個不同真姿勢，走路交替腿、攻擊預備／命中／復位、受擊與倒地皆保留；第 3 格命中由原引擎控制。新原畫只有右向 3/4 視角，左向是鏡像衍生，不能稱六方向重畫。原 MIT 六方向圖、素材與所有授權未改；CREDITS 已補記。

## 前後、商店、動態與驗證

- 九組同流程前後：`docs/art/compare/r4/before/`／`after/`，390×844、844×390、1032×1376，各開場／守城／攻城；同名根目錄圖為左右對照，原圖不變。索引：`docs/evidence/art-r4-index.json`。
- 六張商店原圖：`docs/store/screenshots/`，iPhone 1290×2796、iPad 2064×2752，各開場／守城／攻城。Chromium 模擬視口／DPR，不冒稱原生包或實體 iOS 證據。
- 真實時鐘五秒動態：`docs/art/r4/motion/real-combat-0.png` 至 `real-combat-5.png` 與同目錄 WebM；路徑由 `visual-audit.json.video` 綁定。另有商店飛彈連續四幀。
- `npm run verify`：VERIFIED，來源 rules 全綠、Vitest **41／41**、E2E **442**、既有美術 **41＋114** 項、41 份來源雜湊與 2 個來源 repo 狀態均通過，秘密掃描零命中。原測試與斷言未刪改。
- `npm run test:art:r3`：VERIFIED，**83** 項與六章正常 UI 通關；`npm run test:art:r4`：VERIFIED，**108** 項，含新原畫／編碼後色彩／原尺寸圖／角色比例／實際選塔、單一預覽、開場載入完成、iPad Logo 與五秒動態。既有腳本當次證據移存 `docs/art/r4/legacy-checks/`，原 R1／R2／R3 歷史證據還原保留。
- `npm run test:perf`：桌機 1366×600、橫手機 844×390，各三跑、每跑 180 幀，p95 三跑中位皆 **16.8ms**，低於 18ms 參考值。機器有其他線路並發，乾淨機況與實機出貨驗證仍 BLOCKED。
- 最終包體與 hash 以 `docs/evidence/release-audit.json`／`docs/evidence/art-r4-release.json` 為準。新執行資產 **6,046,828 bytes（約 5.77MiB）**；完整 dist 比 0.4.0 約增加 **5.77MiB／26.9%**。原圖、設定表、影片、報告不進 runtime；保留歷史資產以維持授權與回歸，未靠刪歷史圖壓低增量。

## Apple 4.3、未完成與風險

**Apple 4.3 風險：中。** 礦彩山河、朱砂軍令、三相塔陣與兵種剪影已有專屬識別；平台尚未重新審查，仍有同帳號玩法／內容相似性風險。

**BLOCKED／未完成：** 本輪禁止外部派工，未做新的獨立 Muse 複評；不宣稱已達 8 分。真人無字辨識率、3 秒測試、實體 iPhone／iPad、乾淨機況效能未做。新兵種只有一個原畫方向加鏡像；敘事女將是靜態立繪。密集敵軍與工匠仍會互相遮擋，血條可重疊；角色逐姿勢按可見高度正規化，武器伸展時視覺寬度會變。貼地環是示意，不是精確碰撞區。後三章沒有新增地景原畫，沿用既有素材；沒有把未做範圍算完成。

本機 commit hash 見最終回覆。未 push。
