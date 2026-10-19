# 三相邊境 R1 美術重做計畫

2026-10-16。PREPARED。分支 main，原版 0.1.0，目標 0.2.0。僅本 repo 可寫；背景／無頭執行，不派工、不讀秘密、不 push、不部署、不操作商店。repo 無 AGENTS.md／CLAUDE.md／AUDIT_full.md；已讀父目錄 CLAUDE.md、核心規則、指定兩項技能、MERGE 報告與 ART_STUDY。當次明確允許模型 slug 不可見時記工具名，優先於歷史規則的確切 slug 要求。

## 驗收清單

1. 先審：原版 `npm run verify` 實跑，442 項 E2E／33 圖；複製同視口 opening／defense／siege 至 art/compare/before。逐畫面檢討見 ART_REVIEW_R1.md；初次未見 MUSE 檔，收尾盤點補讀新加入的 ART_REVIEW_MUSE.md，逐項採納／缺件見 MUSE_RECONCILIATION_R1.md。
2. 視覺：ART_DIRECTION.md 固定朱砂、青瓷冰、藤紫雷、礦石赭；三相祭塔剪影與切角軍令為識別，避開其餘遊戲的深青圓角模板。
3. 美術／人物／地圖：內建 image_gen 真實生成背景、指揮官、祭塔、面板、圖示、Logo、App icon。固定前綴與完整 prompt、原圖／遮罩／RGBA／runtime hash。透明以工具原生 alpha 優先；opaque matte 依既有 Wave 0 管線去背、邊緣去污。背景 WebP，cutout 真 RGBA PNG。不把概念圖冒充動畫。
4. 角色色彩：不改原授權 master；本 repo 另產有記錄的調色衍生 atlas，保留逐格姿勢與 alpha，固定雙閘門，不放寬閾值。全 28 圖檢測、64px 縮圖人工觀察。三視圖不全者明列。
5. 按鈕／選單：所有核心目標 ≥44px，直橫手機、矮筆電、iPad 可達；modal 可關；手機不顯示鍵盤提示。保持既有資料、花費、存檔與戰鬥流程。
6. 技能／動作：沿用真幀走／攻／傷／死與 impact 結算；共鳴震擊有效命中才扣費，取消不扣費。僅改渲染尺寸、配色、圖片與介面。
7. 接線：home／守城／攻城實際載入新圖；戰場按可用高度延展地景，960×640 邏輯座標保持等比，消除純色 letterbox。塔與單位放大且不改碰撞；避免塔陣遮蔽。
8. 驗證：原有測試不刪不降斷言。`npm run verify`；RWD 至少既有九視口加 1366×768／1920×1080；錯誤與外部請求零；前後同視口；六張商店圖 1290×2796／2064×2752 重擷取。
9. 效能／包體：兩尺寸三跑 p95 中位 ≤18ms 為參考；共享機況不當真機出貨證明。壓縮體積與增量入報告。
10. 版本 0.2.0 同步 package／lock／campaign／release／PWA 快取；秘密掃描零命中、授權保留、manifest／CREDITS；CODEX_RESPONSE_R1_ART.md 繁中收尾，明確路徑 stage 與本機繁中 commit。

## 邊界

本輪無 3D 新模型；2D 製圖依本次指定 image_gen 流程，不套用 3D Blender 重工要求。Apple 4.3／原生真機／獨立模型審查無證據就保留風險，不以美術更換承諾過審。

## 收尾驗收

VERIFIED：本機 0.2.0 美術接線、8 張生成母版／18 份遊戲用輸出、28/28 色彩與真幀／alpha 契約、41/41 共用 alpha gate、npm run verify 全綠（34 tests、來源 rules、442 項 E2E、41 項視覺檢查）、六張新商店圖、同視口前後對照、來源與授權保留、秘密零命中。MUSE 原版評語已納入。兩尺寸三跑 p95 中位約 16.8ms，僅並發載參考。完整證據與未完成列在 CODEX_RESPONSE_R1_ART.md；原生、完整新三視圖、確切生成 slug、改後獨立審查與真人 beta 維持缺件。只建立本機 commit。
