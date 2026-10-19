# Muse 複審入口｜只看手機原尺寸

本表主圖均為 430×932、DPR 1 的完整瀏覽器截圖。請先抽樣以下各列；不要用同一張預覽的箭頭變化代替敵軍實際走路。JSON、影片與數字是輔證，未取代圖片。正式執行狀態與圖片雜湊見 `e2e.json`／`release.json`。

## 1．堵隘與放水：從預覽到城門

| 路線 | 預覽／施工 | 三個真實路程時點 | 終點 |
|---|---|---|---|
| 堵隘向北 | [預覽](phone-terrain-barricade-preview.png)／[施工](phone-terrain-barricade-constructed.png) | [20% 後](phone-terrain-barricade-progress-20.png)／[35% 後](phone-terrain-barricade-progress-35.png)／[65% 後](phone-terrain-barricade-progress-65.png) | [抵達城門](phone-terrain-barricade-full-route.png) |
| 放水向南 | [預覽](phone-terrain-flood-preview.png)／[施工](phone-terrain-flood-constructed.png) | [入水一](phone-terrain-flood-slow-1.png)／[入水二](phone-terrain-flood-slow-2.png)／[入水三](phone-terrain-flood-slow-3.png) | [抵達城門](phone-terrain-flood-full-route.png) |

另看放水 [10% 正常行軍](phone-terrain-flood-progress-10.png)、[50% 離水後](phone-terrain-flood-progress-50.png)，與入水三格比較敵軍位置及前鋒狀態。水域文字移出塔群；同一城門原圖、正式尺度出現在預覽與戰場。

不剪接影片：[堵隘全程](phone-terrain-barricade-route.mp4)、[放水全程](phone-terrain-flood-route.mp4)。每格是真實無頭瀏覽器畫面，時鐘推進遊戲時間，8fps 編碼；這是加速模擬時間的操作證據，不能當實體手機錄影或效能量測。

## 2．同一渡口存檔的兩條路

| 分支 | 選擇／結果 | 下一章 | 重載 | 後續 |
|---|---|---|---|---|
| 留工事 | [選前](phone-ford-tower-before.png)／[收據](phone-ford-tower-result.png) | [繼承・一級](phone-ford-tower-next.png) | [冰塔仍在](phone-ford-tower-reloaded.png) | 固定一級工事，不冒稱玩家自選養成塔 |
| 拆晶 | [選前](phone-ford-crystals-before.png)／[收據](phone-ford-crystals-result.png) | [空地基](phone-ford-crystals-next.png) | [空地基仍在](phone-ford-crystals-reloaded.png) | [原位重建](phone-ford-crystals-rebuilt.png) |

結晶飛行三格：[1](phone-ford-crystals-flight-1.png)／[2](phone-ford-crystals-flight-2.png)／[3](phone-ford-crystals-flight-3.png)。兩支從同一份自然攻城勝利存檔 `attained-ford-save.json` 經公開匯入恢復，不注入勝利、結晶或角色。

## 3．三題各四狀態，以及相同預算的失敗排法

[首頁入口](phone-exercise-home.png)／[演習列表](phone-exercise-list.png)／[重載完成紀錄](phone-exercise-records.png)。

| 題目 | 成功布陣 | 交戰 | 失敗 | 完成 | 花完同額預算的失敗布陣 |
|---|---|---|---|---|---|
| 聚印轉角 | [布陣](phone-exercise-turn-formation.png) | [交戰](phone-exercise-turn-combat.png) | [首漏即敗](phone-exercise-turn-failed.png) | [共鳴](phone-exercise-turn-complete.png) | [火1／冰4／雷5](phone-exercise-turn-losing-formation.png) |
| 分守長堤 | [布陣](phone-exercise-levee-formation.png) | [交戰](phone-exercise-levee-combat.png) | [首漏即敗](phone-exercise-levee-failed.png) | [分散接力](phone-exercise-levee-complete.png) | [火1／冰2／雷4](phone-exercise-levee-losing-formation.png) |
| 折返雙隘 | [布陣](phone-exercise-switchback-formation.png) | [交戰](phone-exercise-switchback-combat.png) | [首漏即敗](phone-exercise-switchback-failed.png) | [共鳴加升級](phone-exercise-switchback-complete.png) | [火2／冰5／雷6，雷升級](phone-exercise-switchback-losing-formation.png) |

三題原有塔位、血量、敵數與速度不變，增加遠哨塔位供真正取捨；多種成功排法存在，沒有宣稱只有一個正解。各失敗頁可直接重新布陣，恢復全預算；戰役錢包與演習分開。界碑名牌位在地圖邊緣，以線連回真塔位；小手機六名牌分成兩排。

同題另一種成功解也有圖：聚印轉角 [分散布陣](phone-exercise-turn-alternative-formation.png)／[分散完成](phone-exercise-turn-alternative-complete.png)；折返雙隘 [分散布陣](phone-exercise-switchback-alternative-formation.png)／[分散完成](phone-exercise-switchback-alternative-complete.png)。與上表的共鳴解比較，並非每題只有一組正解。

## 4．真人與實機

BLOCKED：需要五名沒玩過的新玩家及實體 iPhone／iPad。具體表單見 [實機測試待辦](DEVICE_TEST_PROTOCOL.md)，沒有以瀏覽器模擬填造人數、成功率或觸控感受。

## 5．第一波前與商店前兩張

[第一次開波必看的預覽](phone-terrain-first-wave-required.png)：玩家取消後不扣款，仍需自己按開波；已看狀態重載保留。商店四張的本機使用順序及原尺寸見 [商店畫面清單](../../store/SCREENSHOTS.md)。5 人中 4 人只看商店圖即辨識本作玩法，仍待真人測試。
