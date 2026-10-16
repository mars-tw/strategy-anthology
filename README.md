# 三相邊境 · Trine Frontier

以火冰雷守住松林，用結晶訓練部隊反攻渡口，再把收復的土地變成下一道防線。這是一款六章交替守城與攻城的單人策略遊戲，整合自 MIT 開源專案《無盡塔防》（tower-defense）與《村莊攻防》（village-siege）。

本專案免費、非營利，以 MIT 開源。希望玩家玩得開心，也歡迎用這份程式建立自己的遊戲；MIT 允許商用，非營利是本專案的營運選擇。

## 建置與本機遊玩

需要 Node.js 24 與 npm。

```powershell
npm ci
npm run build
npm start
```

瀏覽 `http://127.0.0.1:8187`。建置輸出在忽略的 `dist/`，不會提交。正式 runtime 無 CDN、帳號、廣告或外部 API；首次完整載入並顯示「離線可玩」後，可在相同網址離線重開。部署時須使用 HTTPS；localhost 可測試 Service Worker。沒有自動部署指令。

## 怎麼玩

- 按「接下塔印，守住松林」直接進第一章。選火、冰、雷塔，再按確認建造；預設建議位互相相鄰，三塔傷害各加 30%。開始下一波讓敵軍進場。
- 守城結晶與三才印記解鎖弓手／術士。攻城時先建兵營，再訓練部隊；工匠會採集並搬回同一個結晶錢包。用雙線軍令安排補給與行軍，也可點戰場或「全軍攻向據點」。
- 共鳴震擊需點中敵群才扣 20 結晶；取消與空放不消耗。守城點已有塔後按確認可花 60 結晶升級，最多三級。
- 暫停、設定、返回戰報由同一個外殼管理。Esc 暫停／關閉，Enter 確認塔位。手機和平板支援直橫向。

## 存檔與原作進度

只有 `trine-frontier:campaign:v1` 一份主進度，包含章節、結晶、解鎖、設定與中途戰局。每三秒、關頁、背景與重要操作保存；儲存失敗會顯示提示，可重試或匯出。瀏覽器突然終止可能回到上次 checkpoint，清除網站資料會刪除本機進度。

「存檔與原作匯入」可貼無盡塔防 Base64 存檔碼／meta JSON、村莊章節紀錄 JSON，或本作備份 JSON。必須先預覽再確認；舊作每種來源只領一次結晶，原始輸入完整封存於匯出檔的 `legacyArchive`。匯入前另備份目前主進度。沒有讀取或寫入原作的 localStorage／IndexedDB。

村莊章節 JSON 格式例如：`{"supply":{"stars":3,"bestTicks":628}}`。需由原作既有本機紀錄自行匯出。本輪沒有修改原作加匯出按鈕。原作英雄、完整自由戰役、中途單位／建築狀態無法同構接續；封存原文而不假稱全部玩法已搬入。詳見 [整合設計](docs/MERGE_DESIGN.md)。

## 驗證

```powershell
npm test
npm run build
npm run test:e2e
npm run test:perf
node scripts/audit.mjs
```

無頭測試使用已安裝的 Google Chrome（`channel: 'chrome'`），不開可見視窗。來源規則測試原樣放在 `vendor/`；新測試覆蓋完整六章、戰鬥命中幀、存檔與匯入，E2E 使用公開按鈕與瀏覽器虛擬時鐘。效能是並發載參考值；原生打包、真機、TestFlight beta 與商店送出尚未執行。

來源與授權：[CREDITS.md](CREDITS.md)、[逐檔 manifest](docs/ASSET_MANIFEST.json)。交付範圍與缺件：[CODEX_RESPONSE_MERGE.md](docs/CODEX_RESPONSE_MERGE.md)。所有商店文字僅為本機草稿。
