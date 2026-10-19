# 三相邊境｜新內容第 5 輪

VERIFIED：工作單 2026-10-18，執行 2026-10-19；分支 `main`，版本 **0.13.0**。依 `content/CONTENT_REVIEW_R4_MUSE.md` 的唯一五項清單修正，計畫見 [OPTIM_PLAN_CONTENT_R5.md](OPTIM_PLAN_CONTENT_R5.md)。本輪只做本機 commit，沒有 push、部署、商店操作、對外發訊息或派工。

## 三項內容、入口與操作

| 內容 | 正常入口／怎麼玩 | 本輪完成 |
|---|---|---|
| 攻下一座，留下一塔 | 「奪回渡口」勝利頁選留冰塔工事或拆取 90 結晶，再接「河岸烽火」。 | 補齊留塔選擇、下一場工事位置、首波射擊與命中四格；工事全名與共鳴 +30% 同框。拆晶落點改在錢包數字外側，抵達隱去晶體、保留旁側小印，501 不再被遮住；飛行按鈕直接寫「結晶送達後可接續」。 |
| 戰前改地形 | 每場守城第一波前按「戰前工事」，選堵隘／放水，確認花 30；取消免費。 | 換成不規則淹水土路原畫，移除靶心同心圓。前鋒顯示正常／入水 52%／出水恢復速度。火冰雷三行可逐一點選，地圖只亮該元素的實際射程與新路覆蓋段；縮小預覽城堡，讓覆蓋段露出。320 寬及矮筆電均不需捲動、控制至少 44px。 |
| 三印窄陣 | 首頁「三印窄陣・布陣演習」，選題、選塔、點界碑或「換塔位」、確認建造後開波。 | 界碑改顯示「1 火塔／2 冰塔」等身份；無法再建及交戰空位顯示「留空」。塔與敵兵依地面深度繪製，後方敵兵不再蓋住塔頂。交戰按鈕明示布陣已固定；三題均有同預算勝敗四態，兩題完成共鳴 +30%。 |

留塔仍是**固定位置的一級冰塔工事**，沒有冒稱上一場養成塔繼承。三題維持原預算 300／300／360、塔位、敵數、血量、速度與塔屬性，沒有靠改血量增加內容。戰役錢包、演習預算與完成紀錄分開保存。

## 唯一五項驗收與原尺寸路徑

| Muse 項目 | 原尺寸手機證據 | 結果 |
|---|---|---|
| 1 留塔四格 | [留塔選擇](content/r5/phone-ford-tower-choice.png) → [下一場名牌與塔位](content/r5/phone-ford-tower-next.png) → [首波開火](content/r5/phone-ford-tower-combat.png) → [冰彈命中](content/r5/phone-ford-tower-hit.png)。後兩格相隔 150ms，名稱、冰塔與 +30% 同框。 | VERIFIED；繼承一級、首波傷害、共鳴、重載不重領均有自動檢查。 |
| 2 放水四格 | [入水前](content/r5/phone-terrain-flood-before.png) → [水中](content/r5/phone-terrain-flood-inside.png) → [出水後](content/r5/phone-terrain-flood-after.png) → [抵達城門](content/r5/phone-terrain-flood-gate.png)。 | VERIFIED；同一前鋒 `u2`，路程 18%→32%→55%→100%，速度標籤 50→26→50 世界 px/s。 |
| 3 拆晶遮擋 | [0ms](content/r5/phone-ford-crystals-flight-1.png)、[650ms](content/r5/phone-ford-crystals-flight-2.png)、[1300ms](content/r5/phone-ford-crystals-flight-3.png)。 | VERIFIED；411→411→501，飛行按鈕有等待原因，三格均無可見晶體與數字重疊。途中重載與連點不重領。 |
| 4 射程可核對 | [火](content/r5/phone-terrain-inspect-cannon.png)、[冰](content/r5/phone-terrain-inspect-frost.png)、[雷](content/r5/phone-terrain-inspect-tesla.png)；320 寬：[火](content/r5/phone-small-terrain-inspect-cannon.png)、[冰](content/r5/phone-small-terrain-inspect-frost.png)、[雷](content/r5/phone-small-terrain-inspect-tesla.png)。 | VERIFIED；堵隘預覽火／雷零重疊、冰有覆蓋。選中行、實際塔 ID、相交路段同步；圖例讀回為「朱線箭頭：新路」。 |
| 5 三題四態 | 下表及 [三題並排原圖](content/r5/EXERCISE_COMPARISON.html)。 | VERIFIED；每題勝敗餘額同為 0，失敗皆有紅圈漏怪點，塔名／空位清楚；聚印轉角、折返雙隘完成 +30% 且有成因句。 |

| 題目 | 佈陣 | 交戰 | 完成 | 同額失敗 | 勝敗耗用／餘額 |
|---|---|---|---|---|---|
| 聚印轉角 | [原圖](content/r5/phone-exercise-聚印轉角-formation.png) | [原圖](content/r5/phone-exercise-聚印轉角-combat.png) | [原圖](content/r5/phone-exercise-聚印轉角-complete.png) | [原圖](content/r5/phone-exercise-聚印轉角-failed.png) | 各 300／0；完成共鳴 +30% |
| 分守長堤 | [原圖](content/r5/phone-exercise-分守長堤-formation.png) | [原圖](content/r5/phone-exercise-分守長堤-combat.png) | [原圖](content/r5/phone-exercise-分守長堤-complete.png) | [原圖](content/r5/phone-exercise-分守長堤-failed.png) | 各 300／0；分散接力 0% |
| 折返雙隘 | [原圖](content/r5/phone-exercise-折返雙隘-formation.png) | [原圖](content/r5/phone-exercise-折返雙隘-combat.png) | [原圖](content/r5/phone-exercise-折返雙隘-complete.png) | [原圖](content/r5/phone-exercise-折返雙隘-failed.png) | 各 360／0；完成共鳴 +30% |

放水四格的世界座標依序為 `(226.40,192)`、`(272,310.43)`、`(444.86,384)`、`(848,480)`。另以連續一秒實際位移核對速度，測得約 **50.40→26.21→49.60** 世界 px/s；與引擎 50→26→50 相符，微差來自 RAF 取樣間隔。數據見 `content/r5/e2e.json` 與 `flood-route-samples.json`。

## 15 張審查精選與商店圖

`content/r5/review-set/` **恰好 15 張**，01–05 留塔／拆晶、06–10 地形、11–15 演習，各 5 張，全部含遊玩進行中的證據。01–04 是留塔四格，06–09 是放水四格，11–13 各含一題四態，14–15 是接續交戰命中幀。[完整索引](content/r5/REVIEW_INDEX.md)。

其中十張是單次遊戲原圖；五張是清楚標示的**二欄直式證據對照頁**，不是單次遊戲畫面。每格保留實玩 PNG 的 430×932 原像素，以 215×466 CSS、DPR 2 擷取，沒有重採樣、裁切或補畫；最終對照圖為 860×2024。`review-set.json` 記錄來源與實體像素座標，`release.json` 逐格比較像素完全一致，並驗證複製雜湊。

新增兩張正式本機建置的原尺寸商店截圖，未縮放補尺寸，既有商店圖位元組保留：

- `docs/store/screenshots/iphone-content-r5-terrain-1290x2796.png`
- `docs/store/screenshots/ipad-content-r5-terrain-2064x2752.png`

## 自動測試與讀回

**VERIFIED：完整 `npm run verify` exit 0，既有測試與斷言均保留。**

| 驗證 | 最終結果 |
|---|---|
| vendor 規則與 Vitest | 全綠；10 個測試檔、96 項 Vitest |
| 核心瀏覽器回歸 | 464 項檢查；九種直橫／平板／矮筆電視口 |
| 現行 R7 美術回歸 | 309 項檢查、三種視口；角色真姿勢與原始素材雜湊保留 |
| 歷史內容回歸 R1／R2／R3／R4 | 303／367／474／327 項檢查全綠 |
| 本輪 R5 | 537 項檢查、73 張原尺寸截圖；三項實玩、完成與存檔／重載均通過 |
| 最終讀回 | `content/r5/release.json`：243 項通過，秘密掃描零命中 |

瀏覽器只快轉經過時間，所有操作走正常 UI；渡口分支透過公開匯入還原自然通關存檔，沒有注入金錢、角色或勝利。離線冷重載能載入新水域並操作預覽。全部使用單一無頭瀏覽器／本機 server 依序執行，用畢關閉；沒有可見視窗。

`content/r5/verification-artifacts/npm-verify.json` 與 UTF-8 log 保留完整命令、exit code、最終建置／樣式／log 雜湊。歷史測試產生的 **407 份變更證據**已封存並還原舊位元組，收據在 `verification-artifacts/receipt.json`；初始未追蹤審查檔未修改或加入提交。試跑舊預覽另行封存，不當成本輪最終證據。

## 效能、美術與文案

VERIFIED（並發載參考）：放水／折返雙隘，各在 1366×600 與 320×568 三跑，每跑 180 個**真實 RAF** 樣本，未使用虛擬時鐘。四組三跑中位 p95 與全部單跑最大 p95 均為 **16.80ms ≤18ms**。完整資料見 `content/r5/performance.json`；不是乾淨機或實體 iOS 效能證明。

新增 **1 張生成母版、1 張 runtime 水域圖**。實際工具 **`image_gen__imagegen`**，模型 slug 未回傳，未猜測型號。逐字沿用 `PROMPTS_R7.json.stylePrefix`，原始透明 PNG、完整提示、尺寸、alpha 與 SHA-256 見 `content/r5/art/`；runtime 為 `public/assets/content-r5/flood.webp`。既有塔、角色、動作圖集、MIT 與來源授權保留。

繁中文案依 mode 2 直接校對，金額、題名與規則不變：

| 原句／呈現 | 原因 | 改成 |
|---|---|---|
| 飛行時停用的「接續下一章」 | 看不出停用原因 | 「結晶送達後可接續」 |
| 交戰時仍顯示「開始下一波」 | 容易誤認可開波 | 「本波交戰中・布陣已固定」；一般守城顯示「稍候下一波」 |
| 空位只寫「界碑 4」 | 容易誤認尚未解鎖 | 預算不足再建或交戰後顯示「4 留空」；已建處標元素塔名 |

## 風險與未完成

**Apple 4.3 風險：中。** 改路後重排塔、攻守相接的工事選擇、同預算三種窄陣解法仍是本作主軸；未加入通用任務、抽卡或養成模板。但核心仍是三元素塔防，不能以本機驗證代替平台審查。無新增廣告、付費、外部連結、第三方 SDK、帳號或線上功能。

**BLOCKED：實體 iPhone／iPad、真人或親子理解測試、乾淨機況效能及 Muse ≥8 分獨立複審。** 需實體裝置、新玩家／親子受測者與審查員；操作表見 [DEVICE_TEST_PROTOCOL.md](content/r5/DEVICE_TEST_PROTOCOL.md)。本輪本機可完成的五項修正、實玩與證據已 VERIFIED，沒有自行宣稱取得 Muse 8 分。
