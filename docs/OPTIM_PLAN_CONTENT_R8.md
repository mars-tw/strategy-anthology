# 三相邊境｜新內容 R8 計畫

PREPARED：2026-10-19。僅目前 repo／main，本機 commit，不推送、不部署、不對外派工。保留初始未追蹤審查檔。唯一驗收清單為 CONTENT_REVIEW_R7_MUSE.md 的五項，合併 GPT／Claude 的具體缺陷。

## 三項設計

1. 攻下一座，留下一塔：統一視角的三張比較圖加粗真實覆蓋路段、首擊起點，提供正常放大入口；同一首波分別記錄留塔本身命中、傷害與資源收支，拆晶收據重載與渡口冰塔補圖。
2. 戰前改地形：封路本體放大成中斷道路與木柵；輔助關閉下拍接近、轉彎、進入新路三格；水面與判定一致，只有實際涉水敵軍出現行速標示；相同首波、同額投入、相同塔位實際交火比較。
3. 三印窄陣：五個不同路形保留固定預算與既有勝敗解；塔與界碑避開城樓／其他塔；空位虛線、分散無共鳴改中性描述；失敗先給缺口，具體解題句由玩家展開。

## Muse 五項逐項驗收

| 項目 | 可驗收結果 | 原尺寸圖規劃 |
|---|---|---|
| 接力比較圖 | 430×932 三圖同縮放、粗亮路段前／尾／中不同；首擊路段符合預覽 | phone-relay-choices、三分支 hit／review、放大圖 |
| 堵隘證據 | 輔助關閉仍辨封路；敵軍不穿原封點，連三格方向改變 | phone-terrain-barricade-before／after／enter-1～3 |
| 浮字遮擋 | 火冰雷各有命中三格；數字框不覆蓋塔體與敵軍輪廓，上方不擋敵 | phone-impact-<元素>-before／hit／after |
| 五題差異 | 每題完整選位、交戰、完成、同額失敗；塔／界碑完整可見 | phone-exercise-<id>-formation／combat／complete／failed |
| 決定回顧 | 首波統一來源與範圍、差值與最大差異明示、無關列移除；零命中提示取代表格 | phone-relay-replay-compare、phone-terrain-replay-compare、phone-zero-hit-review |

精選集 10～15 張 430×932 原圖，每項至少 1 張進行中，三項平均分配；堵隘三格優先，五題各一張不同交戰配置納入。其餘完整證據與逐張索引留 r8，精選上限與五題四態無法全部同時放入，索引明列取捨。

## 預定檔案

- src/content-r7.js、src/content-r6.js、src/content-r3.js、src/main.js、src/render-r7.js、src/presentation-r7.js、src/content-r7.css、src/save.js、src/engine.js（依實際需要）。
- tests/content-r8.test.js、scripts/content-r8-e2e.mjs、scripts/content-r8-perf.mjs、驗證／封存腳本；既有測試不刪、不放寬。
- package.json／package-lock.json／src/version.js：0.16.0。
- docs/content/r8/、docs/store/screenshots/ 新圖、docs/CODEX_RESPONSE_CONTENT_R8.md。
- 沿用既有生成美術修正尺度／錨點；若確需新增原畫，使用 image_gen__imagegen 並留下固定前綴與實際工具 manifest。

## 品質閘門

EXECUTED／VERIFIED 依執行證據更新：npm run verify 全綠；每項無頭觸控實玩與完成／存檔；320×568、430×932、844×390、1032×1376、1376×1032 與矮桌機控制可達 ≥44px、無手機鍵盤提示；離線冷啟；商店新圖 1290×2796 與 2064×2752。既有測試寫出的歷史證據先封存再還原，保存本輪摘要與 build hash。秘密掃描零命中、效能 p95 ≤18ms 為並發機況參考；所有瀏覽器序列開啟並關閉、單一 server。

BLOCKED：真機、真人試玩、乾淨機況效能與 Muse 8 分複審需外部設備／人員／獨立審查，不假造。
