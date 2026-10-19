# R1 同視口前後對照

VERIFIED。本機 2026-10-16 實際無頭截圖。

- before：本輪開始，原 main `230cf0eb9db01cf8d186ce760bdd07cbc512d4d5`、0.1.0，實跑 npm run verify 後保存。before/e2e.json 為 442 項檢查；不是從舊報告假借當次執行。
- after：0.2.0 最終正式建置，npm run verify 重新擷取。
- 390×844、844×390、1032×1376 各有 opening／defense／siege 同名配對，沒有裁切或補像素。另有三張 390×844 左右並排；36px 檔頭只標 before／after 版本，不修改遊戲畫面。
- 開場皆新進度；守城皆三塔建成、尚未開波；攻城沿用同一公開操作流程產生的第二章 checkpoint。攻城單位有真實動作與時間差，並排不是逐像素定格回歸。
- after 中另外保留 art-audit 的其他尺寸開場／守城，以 visual-audit.json 為準。商店圖另由 e2e 以 DPR 3／2 直接產出 1290×2796／2064×2752。

背景、UI、城鎮與塔在最終遊戲實載；比較圖只是截圖拼接，不是重繪 UI 或宣傳概念圖。
