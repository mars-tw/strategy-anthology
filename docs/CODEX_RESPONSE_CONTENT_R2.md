# 三相邊境｜新內容 R2

2026-10-19；main；版本 **0.10.0**。

**VERIFIED：最終 npm run verify 全綠、343 項 R2 操作檢查、10 項完整觸控檢查、88 張原尺寸截圖（含兩張新增商店圖）、9 段連續影片與歷史證據封存讀回。** 真人／實機／新的獨立 Muse 分數仍為 BLOCKED。最終機器可讀結果：`content/r2/release.json`。

本輪只處理 Muse R1 的五項驗收與三項內容缺口。全程本機、背景／無頭執行，沒有 push、部署、商店操作、對外訊息或外部派工，未讀取憑證目錄。MIT、免費、無廣告、無內購與離線遊玩維持。

## 三項內容：入口、操作與回饋

| 內容 | 入口與怎麼玩 | 本輪補完 |
|---|---|---|
| 攻下一座，留下一塔 | 「奪回渡口」勝利後，確認留下一級冰塔工事或拆取 90 結晶，再接續「河岸烽火」。 | 選擇文案明說固定渡口轉角工事，介面稱「留下渡口冰塔工事」，避免誤稱保留玩家自己養成的塔。明說決定後不能改、可先返回但仍須決定。結果有確認收據、下一章名稱及位置縮圖；留塔標「繼承・一級」，拆晶有 +90 與結晶飛入錢包，下一章留空地基。重建原位後空地基標記移除。 |
| 戰前改地形 | 每場戰役守城第一波前按「戰前工事」，切換堵隘／放水，確認才花 30 結晶；可取消。 | 預覽直接使用當場地圖、已建塔、地貌與城門。灰虛線原路、朱線新路與移動箭頭並列；顯示實際射程、可命中新路的區段與逐塔文字判讀。塔群密集時不疊塔名牌，避免遮路。路障、水閘放大，放水邊界與水紋常駐，入水敵軍顯示行速 52%。 |
| 三印窄陣 | 首頁「三印窄陣・布陣演習」選聚印轉角、分守長堤、折返雙隘；選塔後按「換塔位」，確認建造，再開波。 | 界碑編號在已建塔旁持續可見。開波鎖布陣，首漏即敗；完成頁依實際陣形說明共鳴或分散接力。補齊三題四狀態、可操作換位、重載接續、失敗重排與三題完成紀錄。戰役錢包與演習預算隔離。 |

## Muse 五項逐項驗收

主要審查入口：[手機原尺寸完整索引](content/r2/REVIEW_INDEX.md)。三題十二張主圖均為 **430×932、DPR 1**；另含 **320×568、DPR 1** 小手機。沒有把合成圖或放大圖當原尺寸證據。

| Muse 項目 | 本機完成與原尺寸截圖路徑 | 驗收界線 |
|---|---|---|
| 1 真地圖預覽 | [320×568](content/r2/phone-small-terrain-preview.png)、[430×932](content/r2/phone-large-terrain-preview.png)、[堵隘反例](content/r2/phone-barricade-preview.png)、[放水](content/r2/phone-flood-preview.png)。原路、新路、封堵點、水域、全塔射程與逐塔判斷都來自真地圖與實際命中半徑；動畫三格見索引。 | 工程／畫面可驗；**BLOCKED：** 5 名新玩家中 4 名答對入口、方向與哪座塔打得到，需 5 名受測者。 |
| 2 施工到走完新路 | 堵隘：[施工](content/r2/phone-barricade-constructed.png)、[進場](content/r2/phone-barricade-entering.png)、[走完](content/r2/phone-barricade-full-route.png)。放水：[施工](content/r2/phone-flood-constructed.png)、[進場](content/r2/phone-flood-entering.png)、[慢行](content/r2/phone-flood-slow-1.png)、[走完](content/r2/phone-flood-full-route.png)。 | 各有一段無剪接、無音軌影片，底部提示隱藏。遠處只建一座冰塔，敵軍實際走完整條路；不是用文字推論路徑。速度 52% 另有單元斷言及實際位置取樣。 |
| 3 兩個留塔分支 | [共同選前](content/r2/phone-legacy-tower-before.png)、[留塔確認](content/r2/phone-legacy-tower-confirmed.png)、[留塔結果](content/r2/phone-legacy-tower-result.png)、[下一章繼承牌](content/r2/phone-legacy-tower-next.png)；[拆晶確認](content/r2/phone-legacy-crystals-confirmed.png)、[拆晶結果](content/r2/phone-legacy-crystals-result.png)、[下一章空地基](content/r2/phone-legacy-crystals-next.png)、[原位重建](content/r2/phone-legacy-crystals-rebuilt.png)。 | 同一份自然通關存檔經公開匯入恢復。兩支都有重載圖與不重領斷言；結晶飛行有三格。確認按鈕直接執行選擇，確認圖是事後收據，並非虛構另一個選擇階段。 |
| 4 三印窄陣完整畫面 | [入口](content/r2/phone-exercise-home.png)、[列表](content/r2/phone-exercise-list.png)、下表十二張、[重載完成紀錄](content/r2/phone-exercise-records.png)。 | 三題各有首漏即敗影片、換位與中途重載圖。第一隻越線即失敗，HP 100→88、只有一隻 escaped；沒有等全波結束。按鈕 ≥44px、視口內且中心可命中。 |
| 5 小手機資訊 | [320×568 改圖](content/r2/phone-small-full-preview.png)、[施工](content/r2/phone-small-full-constructed.png)、[命中震擊](content/r2/phone-small-full-shock.png)、[三塔演習](content/r2/phone-small-exercise.png)。共鳴名稱與來源常駐；只保留焦點塔射程；不足卡寫精確差額；底部只留當下回饋。 | 320×568、430×932 都有從首頁到震擊命中的完整觸控影片，主要操作及缺晶文字至少 12px。**BLOCKED：** 5 人中 4 人三秒辨識選塔／缺晶，以及實體裝置測試。 |

| 演習 | 布陣 | 交戰 | 失敗 | 完成 |
|---|---|---|---|---|
| 聚印轉角 | [原圖](content/r2/phone-exercise-turn-formation.png) | [原圖](content/r2/phone-exercise-turn-combat.png) | [原圖](content/r2/phone-exercise-turn-failed.png) | [共鳴完成](content/r2/phone-exercise-turn-complete.png) |
| 分守長堤 | [原圖](content/r2/phone-exercise-levee-formation.png) | [原圖](content/r2/phone-exercise-levee-combat.png) | [原圖](content/r2/phone-exercise-levee-failed.png) | [分散接力完成](content/r2/phone-exercise-levee-complete.png) |
| 折返雙隘 | [原圖](content/r2/phone-exercise-switchback-formation.png) | [原圖](content/r2/phone-exercise-switchback-combat.png) | [原圖](content/r2/phone-exercise-switchback-failed.png) | [實際策略完成](content/r2/phone-exercise-switchback-complete.png) |

## 測試、動畫與效能證據

完整命令、輸出及逐項結果：

| 檢查 | 最終結果 |
|---|---|
| vendor 原規則與 Vitest | VERIFIED；80 項 Vitest 全綠，原 72 項保留，新增 8 項。 |
| 原有 E2E | VERIFIED；464 項、33 張畫面。 |
| 原有視覺／R2 美術／R7 美術 | VERIFIED；41／114／309 項，來源雜湊及角色真姿勢保留。 |
| R1 新內容回歸 | VERIFIED；282 項、30 張原尺寸畫面。 |
| R2 新內容 | VERIFIED；343 項、82 張原尺寸畫面、7 段影片。 |
| 額外完整觸控鏈 | VERIFIED；10 項、6 張原尺寸畫面、2 段影片。 |
| RWD 與離線 | VERIFIED；320×568、430×932、844×390、1032×1376、1376×1032、1366×600，公開入口／存檔／冷離線與零外部請求。 |

- `npm run verify` → `content/r2/verify-release.txt`。保留原測試與斷言，新增 R2 覆蓋交點、缺晶差額、策略回饋及首漏停止的單元測試，並將新內容瀏覽器檢查接入 verify。
- `node scripts/content-r2-touch-evidence.mjs` → `content/r2/touch-e2e.json`，以觸控 tap 實際完成兩種直式尺寸的建塔、取消、施工、開波與震擊。
- `node scripts/content-r2-perf.mjs` → `content/r2/performance.json`，放水與折返演習、1366×600／320×568、各三跑真實 RAF 間隔，沒有虛擬時鐘。
- `content/r2/e2e.json`、`touch-e2e.json` 綁定正式 game SHA-256；`release.json` 讀回最終建置、圖片像素、影片幀數／尺寸／無音軌、來源及秘密掃描。

最終讀回 **134 項 VERIFIED**，秘密掃描 **0 命中**；版本與快取為 0.10.0，正式身分檔與 README 的舊版號歸零。只有本機 commit，沒有推送或部署。

影片是逐格擷取真實瀏覽器畫面後編碼，8fps、不剪接、不合成單位。路線影片每格推進約 0.5 秒模擬時間；首漏影片每格推進 0.1 秒。它們證明畫面與操作因果，**不作即時效能或實機影片證明**。結晶三格只固定 CSS 動畫時間，不改遊戲進度。沒有新增測試後門或注入勝利、角色、資源。

效能是並發載 Chromium 的參考量測。清機、原生包與實體 iOS 效能仍為 BLOCKED，不能以模擬數字取代。

| 情境 | 1366×600 三跑 p95 中位 | 320×568 三跑 p95 中位 |
|---|---|---|
| 放水交戰 | 16.8ms | 16.8ms |
| 折返雙隘交戰 | 16.8ms | 16.8ms |

## 美術、商店圖與歷史保留

新增 **1 張 RGBA 原畫圖集、2 個物件（空地基／結晶）**，實際工具 **image_gen__imagegen**，模型 slug 未回傳，記為 null。沿用 PROMPTS_R7 的固定礦彩／朱砂前綴；原 PNG 位元組不變，以 Canvas／SVG 取圖，不用色塊或 emoji 充當美術。既有路障、水閘、界碑與角色復用，角色真姿勢及命中時序維持。來源、提示、尺寸、alpha 與 SHA-256：`content/r2/art/`；授權補入 CREDITS。

新增商店原圖：[1290×2796](store/screenshots/iphone-content-r2-1290x2796.png)、[2064×2752](store/screenshots/ipad-content-r2-2064x2752.png)。展示真地圖放水預覽、已建塔射程與改道路段，分別以 CSS 430×932／DPR 3、1032×1376／DPR 2 原尺寸擷取；沒有縮放補尺寸或上傳商店。

舊驗證會重寫歷史圖片與收據。本輪輸出先另封存並逐檔 SHA-256／ZIP CRC 讀回，再還原起點追蹤檔；既有八張商店圖維持起點位元組，七份起點未追蹤 Muse 報告維持內容與未追蹤狀態。新產生的舊輪影片另外封存並保留本機原檔，沒有刪除既有未追蹤檔。收據：`content/r2/verification-artifacts/receipt.json`。R1 比較原圖另存 `content/r2/before/`。

本輪共還原 **132 份**歷史追蹤檔。封存 ZIP 是本機開發證據，不在 dist；沒有以還原舊圖代替本輪測試，這次驗證實際輸出與各檔雜湊仍可從封存讀回。

## 文案校對

依 speak-human-tw mode 2 直接套用，未改價格、機制或章名。

| 原句 | 原因 | 改成 |
|---|---|---|
| 只能選一次。 | 搭配「稍後決定」容易誤解，未交代固定工事。 | 決定後不能更改。可先返回，之後仍須完成選擇。並明說固定河岸轉角工事。 |
| 0%／+30% | 數值沒有名稱與來源。 | 另列「傷害共鳴・尚未成陣／三印相鄰」，保留原數值。 |
| 結晶不足 | 無法直接判斷還差多少。 | 還差 n 結晶，由實際錢包與塔價相減。 |
| 每題固定的通關教訓 | 不一定描述玩家實際採用的陣形。 | 先顯示實際共鳴或分散接力，再附該題觀察。 |

## 未完成、缺件與風險

**Apple 4.3 風險：中。** 跨章工事、戰前改路與固定空間三印布陣提供本作差異，礦彩／紙色語言維持；第一章仍屬三元素塔防，不能宣稱平台已排除相似性風險。此為本線設計判斷，沒有平台審核。

**BLOCKED：** 五名新玩家理解測試、真人親子試玩、實體 iPhone／iPad 觸控、清機／原生效能、平台審查及新的獨立 Muse 複審。需要受測者、實機與獨立審查結果。**未宣稱 Muse 已達 8 分。** 沒有缺少的必要新美術；選擇仍是固定渡口冰塔工事，不是自選位置／等級的塔繼承。正文與主要操作已檢查，既有頁首英文品牌與系統頁尾小字保持原規格。
