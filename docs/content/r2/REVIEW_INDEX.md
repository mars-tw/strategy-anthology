# Muse 複審入口：手機原尺寸證據

本輪原圖位於此目錄。以下主要圖均為 **430×932、DPR 1**，小手機另為 **320×568、DPR 1**。沒有縮放、補畫或把分鏡合成一張；`e2e.json.shots` 列實際尺寸與裝置設定。商店圖另外以原生 DPR 擷取。`before/` 是 R1 原圖，僅供比較。

## 1．真地圖預覽

- [320×568 操作後預覽](phone-small-terrain-preview.png)、[430×932 操作後預覽](phone-large-terrain-preview.png)：包含已建三塔、灰虛線原路、朱線新路、封堵位置與每塔覆蓋判斷。
- [堵隘預覽](phone-barricade-preview.png)、[放水預覽](phone-flood-preview.png)：偏遠冰塔打不到新路的反例。
- 箭頭連續三格：[1](phone-barricade-arrows-1.png)、[2](phone-barricade-arrows-2.png)、[3](phone-barricade-arrows-3.png)。放水也有同名三格。
- 完整公開操作：[320×568](phone-small-preview-operation.mp4)、[430×932](phone-large-preview-operation.mp4)。
- 從首頁開始的完整觸控鏈：[320×568](phone-small-full-operation.mp4)、[430×932](phone-large-full-operation.mp4)，包含建三塔、取消預覽不扣款、確認施工、開波與震擊命中；不是只有預覽頁切換。

**BLOCKED：** 五名新玩家至少四人能辨識入口、方向與射程，尚需五名受測者，未以自動測試替代真人結果。

## 2．施工到走完整條新路

| 地形 | 確認施工後 | 敵軍進場 | 走完整條路 | 連續影片 |
|---|---|---|---|---|
| 堵隘 | [施工](phone-barricade-constructed.png) | [進場](phone-barricade-entering.png) | [到城門](phone-barricade-full-route.png) | [完整鏈](phone-barricade-route.mp4) |
| 放水 | [施工](phone-flood-constructed.png) | [進場](phone-flood-entering.png) | [到城門](phone-flood-full-route.png) | [完整鏈](phone-flood-route.mp4) |

影片沒有音軌，底部提示已隱藏。從確認按鈕所在預覽開始，不剪接；每次擷取間推進 0.5 秒模擬時間，8fps 播放，**為加速操作證據，不是即時效能影片**。遠處只建一座冰塔，讓敵人實際走完整條路；沒有注入敵人、錢包或勝負。水紋與減速牌連續圖：[1](phone-flood-slow-1.png)、[2](phone-flood-slow-2.png)、[3](phone-flood-slow-3.png)。位置與減速標記取樣見 `flood-route-samples.json`。

## 3．同一起點的兩個渡口分支

起點 `attained-ford-save.json` 為本輪用公開操作完成松林防守及渡口攻城後儲存，兩支皆經公開匯入恢復。確認按鈕會直接作出不可逆的一次選擇；確認圖是按鈕按下後的收據狀態，結果圖是動畫結束後的結果頁，不是假造中間選項。

| 分支 | 選擇前 | 已確認 | 結果頁 | 下一章開局 | 重載後 |
|---|---|---|---|---|---|
| 留塔 | [選擇](phone-legacy-tower-before.png) | [確認](phone-legacy-tower-confirmed.png) | [結果](phone-legacy-tower-result.png) | [繼承・一級](phone-legacy-tower-next.png) | [重載](phone-legacy-tower-reloaded.png) |
| 拆晶 | [選擇](phone-legacy-crystals-before.png) | [+90 收據](phone-legacy-crystals-confirmed.png) | [結果](phone-legacy-crystals-result.png) | [空地基](phone-legacy-crystals-next.png) | [重載](phone-legacy-crystals-reloaded.png) |

結晶飛入錢包的連續三格：[1](phone-legacy-crystals-flight-1.png)、[2](phone-legacy-crystals-flight-2.png)、[3](phone-legacy-crystals-flight-3.png)。這三張只設定瀏覽器動畫播放時間以固定取景，沒有修改遊戲狀態。領取額、繼承標記、重載不變與不能重領均有自動斷言。

## 4．三印窄陣：三題共十二張主證據

[首頁入口](phone-exercise-home.png)、[三題列表](phone-exercise-list.png)、[重載後紀錄](phone-exercise-records.png)。

| 題目 | 布陣 | 開波交戰 | 首漏失敗 | 完成與實際策略 |
|---|---|---|---|---|
| 聚印轉角 | [布陣](phone-exercise-turn-formation.png) | [交戰](phone-exercise-turn-combat.png) | [失敗](phone-exercise-turn-failed.png) | [完成](phone-exercise-turn-complete.png) |
| 分守長堤 | [布陣](phone-exercise-levee-formation.png) | [交戰](phone-exercise-levee-combat.png) | [失敗](phone-exercise-levee-failed.png) | [完成](phone-exercise-levee-complete.png) |
| 折返雙隘 | [布陣](phone-exercise-switchback-formation.png) | [交戰](phone-exercise-switchback-combat.png) | [失敗](phone-exercise-switchback-failed.png) | [完成](phone-exercise-switchback-complete.png) |

故意漏敵連續影片：[轉角](phone-exercise-turn-first-leak.mp4)、[長堤](phone-exercise-levee-first-leak.mp4)、[雙隘](phone-exercise-switchback-first-leak.mp4)。先以公開操作讓敵軍接近終點，之後每格只推進 0.1 秒；第一隻越線即出現失敗頁，防線從 100 降至 88，只有一隻 escaped。不是等整波清空。失敗重排圖為各題 `phone-exercise-<id>-retry.png`。布陣固定、換塔位、接續、預算／戰役隔離與紀錄保存見 `e2e.json`；所有主要按鈕均檢查 ≥44px、視口內且中心命中。

可操作的換位預覽：[轉角](phone-exercise-turn-relocate.png)、[長堤](phone-exercise-levee-relocate.png)、[雙隘](phone-exercise-switchback-relocate.png)。中途重載後接續：[轉角](phone-exercise-turn-resumed.png)、[長堤](phone-exercise-levee-resumed.png)、[雙隘](phone-exercise-switchback-resumed.png)。

## 5．320×568 小手機

- [真地圖與三塔覆蓋](phone-small-terrain-preview.png)、[完成施工](phone-small-constructed.png)、[命中震擊](phone-small-shock.png)、[演習陣形](phone-small-exercise.png)。
- 右上共鳴數值旁固定顯示來源；只有焦點塔畫射程。缺晶卡寫精確「還差 n 結晶」，狀態列只提示當下操作。建塔、取消預覽、改地形、開波與命中震擊均走公開觸控操作；主要操作及缺晶文字檢查至少 12px。

**BLOCKED：** 五名新玩家中至少四人三秒內辨識選塔／缺晶，及實體 320×568 尺寸裝置試玩，需受測者與可操作的實機。此處是無頭瀏覽器尺寸模擬。

商店圖：[1290×2796](../../store/screenshots/iphone-content-r2-1290x2796.png)、[2064×2752](../../store/screenshots/ipad-content-r2-2064x2752.png)。完整結案與限制見 `../../CODEX_RESPONSE_CONTENT_R2.md`。新的 Muse 分數仍待獨立複審，未自行宣稱達到 8 分。
