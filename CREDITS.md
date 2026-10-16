# 來源與授權

《三相邊境》Trine Frontier 由本 repo contributors 整合，MIT 授權。完整逐檔路徑、來源 commit、大小與 SHA-256 見 [ASSET_MANIFEST.json](docs/ASSET_MANIFEST.json)。來源 repo 本輪唯讀，沒有 commit 或修改。

來源 HEAD 用於定位，逐檔內容以本輪工作樹讀取的 SHA-256 為準；完整原始 git status 另存 source-baseline.json，不把未提交工作樹內容冒稱全都來自 HEAD。

| 使用項目 | 來源 | 授權與保留 |
|---|---|---|
| 元素共鳴、塔資料與來源回歸測試 | tower-defense，Copyright (c) 2026 阿軒 (mars-tw)，來源公開專案名稱 tower-defense-skill | MIT 原文保留於 vendor/tower-defense/LICENSE；config.js／rules.js／test-rules.js 原樣複製 |
| 兵種、傷害與方向量化、雙線軍令、傷害測試 | village-siege，Copyright (c) 2026 Village Siege contributors | MIT 原文保留於 vendor/village-siege/LICENSE；combat.ts／combat.test.ts／fieldOrders.ts 原樣複製 |
| 建築與地形／自然材質 | village-siege 的 original/frontier/buildings.webp、landscape/materials.webp、nature.webp | 來源 ATTRIBUTION.md 聲明 MIT；原文保留於 vendor/village-siege/ATTRIBUTION.md |
| 工匠、衛士、弓手、盾兵 | village-siege original/frontier/characters 各自六方向真幀 atlas | MIT；每圖 4 欄×6 動作列，無整張圖晃動代替走路 |
| 術士與林獸 | village-siege original/frontier/characters/mage、monsters/miremaw／ashwing／rootback | MIT；原作單視角 4×6 真幀，不宣稱多視角；後兩林獸保留於資源管線，本版主線未配置 |
| 舊作比較截圖 | 兩來源 docs/store/screenshots 中既有圖片 | 僅本機證據，依原 repo MIT 保留來源；不是本輪重新執行原作 |
| 主線、HUD、程式繪製塔印／圖示、Web Audio 提示音 | Trine Frontier contributors | MIT；SVG／Canvas／Web Audio 原生程式，無外部圖示、音源或字型包 |

村莊來源文件將歷史原畫記為專案專用的 OpenAI built-in image_gen 產物，未揭露精確模型 slug。本輪沒有生成新點陣圖，`actualModelSlug: null`，不宣稱使用 gpt-image-2，也不以未知來源圖像補缺。此處記錄原 repo 的權利聲明，不自行擴大其證明範圍；正式送審的來源原始紀錄仍應由帳號持有人保管。

建置／測試依賴 esbuild（MIT）、Vitest（MIT）、Playwright（Apache-2.0）僅作本機工具；沒有把測試套件或其瀏覽器放入遊戲 runtime。系統字型由裝置提供，不隨包散布。沒有新增配樂，只有本機合成的統一短音。
