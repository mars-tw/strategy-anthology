# R4 手機原尺寸複審索引

只看本目錄的本輪原圖。主圖為 **430×932、DPR 1**；小手機為 **320×568、DPR 1**。檔案可點開原尺寸。`phone-exercise-` 後使用完整中文題名；沒有用預覽圖或合成圖代替實玩證據。全部截圖與建置雜湊由 `e2e.json`／`release.json` 對應。

## 1．留塔完整可見鏈

依序看：[勝利頁選留塔](phone-ford-tower-choice.png) → [下一章繼承一級](phone-ford-tower-next.png) → [首波冰彈與共鳴 +30%](phone-ford-tower-combat.png) → [重載仍在](phone-ford-tower-reloaded.png)。補充：[一次性選擇收據](phone-ford-tower-receipt.png)、[同一已領存檔再開不可領](phone-ford-tower-no-reclaim.png)。

畫面有「渡口冰塔工事・繼承一級」、雙線青瓷地面框及「工事開火・共鳴 +30%」。這是一級固定工事，沒有宣稱是玩家上一場養成的塔。

## 2．結晶弧線與抵達跳數

依序看：[0ms，411](phone-ford-crystals-flight-1.png) → [650ms，仍 411](phone-ford-crystals-flight-2.png) → [1300ms，501](phone-ford-crystals-flight-3.png)。晶體所在位置與錢包數字由真正畫面時鐘記錄在 `e2e.json.salvage`，沒有對無效的 CSS 動畫設定時間。

補充：[接續後空地基](phone-ford-crystals-next.png)、[重載只領一次](phone-ford-crystals-reloaded.png)、[飛行中重載只領一次](phone-ford-crystals-interrupted-reload.png)。飛行中接續鈕停用；領取以一次性狀態保存，連點不會再入帳。

## 3．兩路各四格，不重複位置

| 次序 | 放水南路 | 堵隘北路 |
|---|---|---|
| 1 | [入水前・行軍](phone-terrain-flood-before.png) | [進入隘口](phone-terrain-barricade-before.png) |
| 2 | [水中・慢行 52%](phone-terrain-flood-inside.png) | [繞向北側](phone-terrain-barricade-inside.png) |
| 3 | [出水後・恢復行軍](phone-terrain-flood-after.png) | [轉向城門](phone-terrain-barricade-after.png) |
| 4 | [抵達城門・100%](phone-terrain-flood-gate.png) | [抵達城門・100%](phone-terrain-barricade-gate.png) |

兩組皆為同一場連續時鐘、同一支前鋒的四個時刻。完整世界座標及速度樣本見 `flood-route-samples.json`、`barricade-route-samples.json`；放水速度由 50 降為 26，再回到 50 世界 px/s。

## 4．三題各四狀態，勝敗同預算

| 題名 | 布陣 | 交戰 | 首漏即敗 | 完成 |
|---|---|---|---|---|
| 聚印轉角 | [原圖](phone-exercise-聚印轉角-formation.png) | [原圖](phone-exercise-聚印轉角-combat.png) | [原圖](phone-exercise-聚印轉角-failed.png) | [共鳴完成](phone-exercise-聚印轉角-complete.png) |
| 分守長堤 | [原圖](phone-exercise-分守長堤-formation.png) | [原圖](phone-exercise-分守長堤-combat.png) | [原圖](phone-exercise-分守長堤-failed.png) | [分散接力完成](phone-exercise-分守長堤-complete.png) |
| 折返雙隘 | [原圖](phone-exercise-折返雙隘-formation.png) | [原圖](phone-exercise-折返雙隘-combat.png) | [原圖](phone-exercise-折返雙隘-failed.png) | [共鳴完成](phone-exercise-折返雙隘-complete.png) |

[三題勝敗布陣原尺寸並排比較](EXERCISE_COMPARISON.html)：兩邊都放齊三塔，聚印／長堤各花 300，雙隘各花 360；差異在塔位，沒有以少放塔冒充取捨。失敗地圖圈出首漏城門，結果明說第一隻越線便結束。另有三題 `*-retry.png`，證明可重新布陣。

320 寬：[名牌貼近塔位](phone-exercise-折返雙隘-small-labels.png)、[換位時原／新位置同亮](phone-exercise-折返雙隘-small-swap.png)。名牌有 44px 點選範圍，測試實際點第 4 界碑並斷言只選中該位。

## 5．預覽與塔卡資訊層級

320 寬：[首次未建塔](phone-small-terrain-empty.png)、[已有三塔](phone-small-terrain-built.png)。兩者同一版面：火／冰／雷三行結論，原路與新路圖例在地圖內；從開啟到確認或取消都不需捲動。塔卡的「場上已有」與「再建需」用兩種底色；已部署原圖保持彩色。

商店新增：[1290×2796](../../store/screenshots/iphone-content-r4-terrain-1290x2796.png)、[2064×2752](../../store/screenshots/ipad-content-r4-terrain-2064x2752.png)，都是真實建置的直接 DPR 擷取，沒有縮放補尺寸。

## 本機驗證界線

實體 iPhone／iPad 與真人理解測試為 **BLOCKED**：需實體裝置及新玩家。瀏覽器尺寸與語意斷言可證明排版／狀態，不能代替「隨機指一張卡能正確說出含義」的真人測試。Muse 複審分數另待獨立審查，沒有自行宣稱達到 8 分。
