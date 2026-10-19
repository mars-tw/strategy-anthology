# R5 原尺寸複審索引

本次只交付 `review-set/` 內 15 張直式證據，留塔／拆晶、地形、演習各 5 張。為在 15 張內保留全部分支，五張採「原尺寸二欄直式對照圖」：每格是實玩 PNG 的 430×932 原像素（215×466 CSS、DPR 2），沒有縮圖、補畫或重造遊戲狀態；對照圖是證據頁擷取，**不是單次遊戲畫面**。其餘十張是單次遊戲原圖。來源、複製雜湊與每格座標列於 `review-set.json`，`release.json` 比對對照圖內每格與原圖像素一致。

| 審查五項 | 手機直式原圖（相對本資料夾） | 精選編號 |
|---|---|---|
| 1 留塔四格 | `phone-ford-tower-choice.png` → `phone-ford-tower-next.png` → `phone-ford-tower-combat.png` → `phone-ford-tower-hit.png`。後兩格為連續時間，完整工事名牌、冰彈與 +30% 同框。另有 receipt／reloaded／no-reclaim。 | 01–04 |
| 2 放水四格 | `phone-terrain-flood-before.png` → `phone-terrain-flood-inside.png` → `phone-terrain-flood-after.png` → `phone-terrain-flood-gate.png`。同一前鋒 ID、座標連續，50→26→50 px/s；最後抵達城門。 | 06–09 |
| 3 拆晶抵達 | `phone-ford-crystals-flight-{1,2,3}.png`，0／650／1300ms，411／411／501；飛行中按鈕直接說明等待，抵達圖示不壓數字。另有中斷重載與不重領驗證。 | 05，三格 1:1 對照圖 |
| 4 射程結論可核對 | `phone-terrain-inspect-{cannon,frost,tesla}.png`，逐行選中；火雷零重疊、冰有實際覆蓋段。320 寬另有 `phone-small-terrain-inspect-*.png`，每行 ≥44px、取消與施工不重疊、不需捲動。 | 10，三格 1:1 對照圖 |
| 5 三題四態 | `phone-exercise-聚印轉角-*`、`phone-exercise-分守長堤-*`、`phone-exercise-折返雙隘-*` 各 formation／combat／complete／failed；另有 losing-formation／hit／retry。勝敗皆餘額 0，失敗圈出漏怪點，聚印轉角與折返雙隘完成 +30% 且有成因句。 | 11–13，各四格 1:1 對照圖；14–15 是接續交戰命中幀 |

[三題四態並排（原圖不縮放）](EXERCISE_COMPARISON.html)。各題的同額勝敗支出、完成共鳴、失敗漏點在 `e2e.json.exercises`；路線四格實際座標與速度在 `e2e.json.routes`。測試只快轉時間，透過公開 UI 操作與公開存檔匯入還原自然通關分支。

實體手機／平板、真人理解、親子試玩與 Muse 複審分數為 BLOCKED；所需條件見 [待補測試](DEVICE_TEST_PROTOCOL.md)。
