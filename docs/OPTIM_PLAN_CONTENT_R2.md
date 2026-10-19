# 三相邊境｜新內容第二輪

2026-10-19；分支 main；起點版本 0.9.0。執行結果：本機工程與證據 VERIFIED；真人／實機／獨立複審 BLOCKED。詳見 `CODEX_RESPONSE_CONTENT_R2.md` 與 `content/r2/release.json`。

唯一驗收依據：`docs/content/CONTENT_REVIEW_R1_MUSE.md`「下一輪最該做的 5 件事」。repo 無 AGENTS.md、CLAUDE.md、AUDIT_full.md；已讀共用核心規則、game-optimization-round、token-efficient-ai-dispatch 與美術方向。這次明確禁止外部派工、推送與部署，全程本機、背景／無頭執行。起點七份未追蹤 Muse 報告不修改、不提交。

## 三項設計與檔案

| 內容 | 本輪設計與驗收 | 預計修改 |
|---|---|---|
| 攻下一座，留下一塔 | 改名實說為「留下渡口冰塔工事」；明說固定塔位與決定不可更改。選項以明確的確認按鈕直接執行；拆晶顯示 +90 與飛入錢包的結晶、空地基；留塔顯示「繼承・一級」牌。結果提供河岸烽火位置縮圖。從同一自然取得存檔記錄兩支的選擇、確認、結果、下一章及重載，驗證只能領一次。 | src/main.js、src/render-r7.js、src/content-r2.js、src/content-r2.css、新美術及 manifest、tests/content-r2.test.js、scripts/content-r2-e2e.mjs |
| 戰前改地形 | 用實際戰場預覽，保留已建塔，疊原路、新路、入口、城門、方向箭頭、封堵點、水域邊界與全部射程；列每座塔可覆蓋的新路區段，依真正戰鬥半徑計算。施工後放大既有路障／水閘，持續水紋與入水減速牌。320×568、430×932 完整操作錄影、連續三格與走完整條改道影片；取消不扣款、確認只扣一次、存檔持續有效。 | src/main.js、src/render-r7.js、src/content-r2.js、src/content-r2.css、scripts/build.mjs、tests/content-r2.test.js、scripts/content-r2-e2e.mjs |
| 三印窄陣 | 保留三道固定預算與獨立存檔；全程看見界碑編號，布陣與交戰有共鳴／分散解釋。完成依實際陣形給回饋。三題各布陣、交戰、故意漏敵失敗、完成共 12 張原尺寸手機圖；影片證明第一隻越線立即失敗。檢查 44px、換塔位、開波鎖定、接續、失敗重排及完成紀錄。 | src/main.js、src/render-r7.js、src/content-r2.js、tests/content-r2.test.js、scripts/content-r2-e2e.mjs |

## Muse 五項逐項證據

1. 真地圖預覽：320×568 與 430×932；方向箭頭三格、全流程影片、射程實際覆蓋自動斷言。五名新玩家至少四名答對入口／方向／覆蓋：BLOCKED，需要五名未接觸功能的受測者。
2. 施工與交戰：堵隘／放水各施工→進場→走完全路影片；隱藏底部提示擷取地圖證據；水域邊界、水紋與速度 52% 可測。
3. 留塔兩支：同起點存檔、選前／確認／結果／下一章／重載；晶體動畫三格、原位空地基、繼承牌與結果縮圖。
4. 三印窄陣：每題四狀態共 12 圖、首漏即敗影片、44px 命中檢測、存檔與資源隔離。
5. 小手機清晰度：共鳴明示來源；交戰只畫焦點射程；缺晶顯示精確差額；320×568 建塔、改圖、開波、命中震擊完整操作。正文至少沿既定 12px；5 人中 4 人三秒答對選塔／缺晶：BLOCKED，需要受測者。實體裝置：BLOCKED，需要 iPhone／iPad。

## 品質與交付

- 維持既有礦彩、朱砂與宣紙；復用已生成路障／水閘／界碑。新增地基與結晶只用 image_gen__imagegen，記真實工具與來源雜湊；不以色塊充當美術。
- `npm run verify` 保留全部舊測試／斷言並加入 R2。既有驗證會重寫歷史證據：先保存起點位元組，將本輪輸出另封存後再還原，不刪起點未追蹤檔。
- 瀏覽器串行、單一臨時 server、結束立即關閉。無頭手機直橫、iPad、矮筆電矩陣；離線與零外部請求。
- 並發載真 RAF p95 三跑中位 ≤18ms，僅參考；實體／清機效能 BLOCKED。
- bump 0.10.0；正式來源舊版號歸零、秘密掃描零命中；新增商店原尺寸 1290×2796、2064×2752，保留既有圖。
- `docs/CODEX_RESPONSE_CONTENT_R2.md` 逐項連結圖／影片／收據，列明 VERIFIED 與 BLOCKED，不自行宣稱 Muse 已評 8 分。只用明確路徑 git add、繁中本機 commit。
