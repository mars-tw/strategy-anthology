# 三相邊境｜新內容 R9 修正計畫

PREPARED：2026-10-19；僅本 repo／main，本機 commit。已讀全域 core-rules、token-efficient-ai-dispatch、game-optimization-round、game-engine、playwright、speak-human-tw、ART_DIRECTION，以及 R7／R8 的 Muse、GPT、Claude 六份審查。repo 沒有 AGENTS.md／CLAUDE.md，沿用工單提供的 AGENTS 指令。禁止外部派工、發布與讀取秘密目錄。

本輪只修既有三項內容，不增加玩法或關卡。唯一主驗收為 R8 Muse §4 五項；同時逐條覆核 R8 Claude 七項、R7／R8 GPT 五項及 R7 Muse／Claude 回歸。

| 三項內容 | 修正設計與驗收 | 預計檔案 |
|---|---|---|
| 留塔接力 | 命中、首波快照、回顧來自同場資料；標明場次與分支，新塔補位逐塔可核對。拆晶收據於領取後、下一場開波前及重載／戰報可讀，明列來源、+90、入帳餘額。三分支命中、渡口冰塔與重演隔離均補證。 | src/content-r7.js、src/content-r8.js、src/main.js、src/campaign.js、src/save.js、tests/content-r9.test.js |
| 戰前改地形 | 封閉舊路有原畫塌石木柵，新路完整路面；同一敵軍三格完成接近、北轉、新路推進。放水水面與真實慢行區一致；標籤避讓角色。輔助關閉仍有防線／波次。相同兩塔、200 支出比較實際交火，保留震擊投影回歸。 | src/render-r7.js、src/content-r2.js、src/content-r9.css、scripts/content-r9-e2e.mjs |
| 三印窄陣 | 五題選位／交戰標籤零互疊、避開塔與敵軍；空位帶編號虛線底座。雙岸有真實原畫河道。失敗未展開只報首漏／缺口，不洩塔位解法；交戰收起購買控制。頂部改演習狀態，預算統一稱演習餘額；各題同額勝敗、重載、零共鳴與留空成功可證。 | src/main.js、src/render-r7.js、src/content-r3.js、src/content-r7.js、src/content-r9.css、scripts/content-r9-e2e.mjs |

## 驗證與交付

- 新單元測試核對首波逐塔加總、同場命中與持久化、補位說明、提示時機；新無頭觸控 E2E 實玩三項、存檔、五題與 R7 既修項目。
- 保留既有測試與斷言；執行 npm run verify。既有驗證會重寫歷史截圖，先於本機保存所有已追蹤產物，測完逐位元組還原；只提交本輪明確檔案。
- docs/content/r9/ 保存 phone-<內容>-<狀態>.png 原尺寸圖、斷言與場次紀錄；review-set 嚴格 15 張原圖，三項各 5 張。15 張上限不能容納所有五題兩態與全部分支／重載／連拍，精選優先主驗收與七項問題，其餘完整原圖逐項索引，不以拼圖冒充。
- 新增商店真實擷取 1290×2796、2064×2752；保留全部既有截圖。沿用既有生成原畫，若確需新美術才使用 image_gen__imagegen 並記錄實際工具，不使用本機 GPU。
- 版本 0.16.0 → 0.17.0；秘密掃描零命中；手機／橫式／iPad／矮桌機 ≥44px、無溢出；並發負載下 RAF p95 三跑中位 ≤18ms 僅列參考。
- docs/CODEX_RESPONSE_CONTENT_R9.md 列逐條驗收、原圖路徑、文案修改與 Apple 4.3 風險。實體裝置、真人／親子試玩、乾淨機效能與 Muse 複審分數列 BLOCKED，說明所需人員或設備。

VERIFIED：計畫已執行。npm run verify exit 0；145 項單元、R9 887 項斷言與 122 張原圖；補證 13 項、10 張原圖；12 次 RAF 參考量測通過。精選 15 張三項各 5 張，最終收據與 BLOCKED 範圍見 CODEX_RESPONSE_CONTENT_R9.md。
