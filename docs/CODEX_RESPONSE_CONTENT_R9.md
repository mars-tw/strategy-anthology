# 三相邊境｜新內容 R9 修正交付

VERIFIED：2026-10-19，v0.17.0。本輪只修既有三項內容，沒有新增玩法或關卡。僅本 repo／main、本機 commit，未推送、部署、操作商店或派工。主驗收依 R8 Muse §4；六份 R7／R8 審查均納入回歸。

## 三項內容與正常入口

1. **攻下一座，留下一塔**：石脊攻城勝利頁 → 留上游火塔／留城門火塔／拆取 90 結晶。保留原玩法；首波新增不可變的逐塔貢獻與場次編號，命中欄顯示同場首波留塔累計。回顧與重演明列第幾場、配置是否相同；總傷害相同時，逐塔列出補位差額，不把兩場誤接成一場。拆晶收據記錄原餘額、退回 90、入帳後餘額，領取後、下一場開波前及重載後均可讀；戰報首頁也能查到。
2. **戰前改地形**：守城第一波前 →「戰前工事」。原畫道路依同一畫面投影鋪滿新路，舊路淡化；塌石木柵恢復完整比例，主力火塔移開封閉點。甲犬保留真四步姿勢，整體含旗幟的高度回到塔體比例，減少離路的隊列偏移。放水用既有原畫的水面取樣，水面遮罩與標籤使用同一取樣；冰塔移開水面。關閉輔助仍保留防線／波次。
3. **三印窄陣**：首頁 →「三印窄陣」，或戰前工事 →「先試三印窄陣」。五題維持原預算、路線與勝敗條件；塔位標籤在獨立上下欄、依相同欄位對應塔體，標籤最後繪製。原位置有帶編號的虛線底座；雙岸接力使用既有渡口河谷原畫。失敗先報真實首漏與路段，按「展開塔位提示」才出現具體解法。開戰後收起不可操作的購買控制；頂端為演習進度，不再亮戰役第 1 關。

## R8 Muse 唯一五項驗收

以下原圖均位於 `docs/content/r9/`，手機直式原尺寸 430×932，不是縮圖或拼圖；精選複本在 `review-set/`。每張來源、當格呈現數據與雜湊見 `e2e.json`、`capture-index.md`、`review-set-manifest.json`。

| 項目 | 驗收與證據 |
|---|---|
| ① 拆晶正式畫面、三分支與渡口冰塔 | `phone-relay-crystals-claimed.png`、`phone-relay-crystals-reload-receipt.png`、`phone-relay-crystals-next.png`、`phone-relay-crystals-hit.png`：收據三個金額及新塔用途。三分支另有 `phone-relay-<upstream/gate/crystals>-hit.png`／`-review.png`；`phone-relay-ford-ice-hit.png` 證明渡口冰塔接力。精選 01、02、04、05 各有實際交火。 |
| ② 堵隘連續三格 | `phone-terrain-barricade-before.png`／`-after.png`、`phone-terrain-barricade-enter-1.png`～`-3.png`。輔助關閉；追蹤同一敵軍 id 的位置推進及北轉，不用不同敵軍冒充連續移動；原始座標在 `e2e.json.detourTrack`；精選另採 2.4 秒間隔的 `phone-terrain-barricade-proof-turn-1.png`～`-3.png`，座標見 `proof-e2e.json.terrainTrack`。精選 06～08。 |
| ③ 回顧口徑與留塔歸零 | `phone-relay-gate-firstwave-total.png`、`phone-relay-gate-review.png`、`phone-relay-gate-replay-last-hit.png`、`phone-relay-gate-same-run-compare.png`。同配置城門分支重演保留非零留塔命中；首波逐塔加總、留塔欄與存檔同源，表頭標場次。不同配置的舊比較保留明確歸因限制與逐塔補位說明。精選 03。 |
| ④ 布陣流程與交戰收斂 | 五題各有 `phone-exercise-<id>-moving.png`、`-formation.png`、`-combat.png`、`-complete.png`、`-losing-formation.png`、`-failed.png`、`-hint.png`。選位、換位、確認付款、開戰、完成均以正常 UI 操作；交戰沒有購買按鈕。精選 11 為確認付款前的選位，12 為零共鳴完成，13～14 為交戰，15 為輔助關閉、尚未展開提示的真實失敗；塔位、耐久與首漏仍保留。 |
| ⑤ 浮字與標籤避讓 | 五題選位與交戰均計算標籤兩兩、標籤對塔／敵軍矩形無重疊；火、冰、雷各有 `phone-impact-<cannon/frost/tesla>-before.png`／`-hit.png`／`-after.png`。水面標籤見 `phone-terrain-flood-enter-1.png`～`-3.png`、`phone-terrain-flood-crossfire.png`。精選 09 採水面清楚的單標籤時刻，另有 11～15。 |

## 七項指定問題與 R7 回歸

| 指定問題 | 修正與回歸原圖 |
|---|---|
| 城門命中與回顧矛盾、全塔相同卻沒解釋 | 同場累計 → 首波快照 → 同配置重打；`phone-relay-gate-firstwave-total.png`、`phone-relay-gate-same-run-compare.png`。全塔相同表示同一批敵軍生命被不同塔分攤，逐塔補位由實測資料計算。 |
| 收據圖只有空地圖 | 真正持久化收據；`phone-relay-crystals-reload-receipt.png` 及精選 04。 |
| 堵隘看不到北路、封閉物與同一敵軍 | 原畫路面、完整塌石木柵、同一敵軍三格；精選 06～08，另有施工前後圖。 |
| 減速無水、雙岸無河 | 原畫水面與同源遮罩、渡口河谷雙岸；精選 09、14。 |
| 未展開已洩解法 | `phone-exercise-hollow-failed.png` 不含「打不到／少了一座／第 4 號」；具體句只在 `phone-exercise-hollow-hint.png`。精選 15 使用 `phone-exercise-hollow-failed-clear.png`（公開防守入口記住的輔助關閉設定）。 |
| 11／13 疊標或被特效蓋住 | 所有五題選位／交戰矩形檢查；標籤上下分欄、最後繪製，引線不穿塔體。 |
| 演習仍亮戰役 1、地形缺防線波次 | 演習專用進度列；工事輔助關閉仍顯示防線與波次。精選 06～15。 |

R7 Muse 五項：放大三分支實際覆蓋圖 `phone-relay-maps-expanded.png`；堵隘前後／三格；三元素命中三格；五題全套選位／交戰／完成／同額失敗；首波差值與零命中引導 `phone-zero-hit-review.png`。R7 GPT 五項也逐條回歸：三分支逐塔貢獻、相同兩塔與 200 支出的地形交火、零共鳴與刻意留空通關、自選提示、密集城門交火及相同首波口徑。完整四波的當次圖為 `phone-relay-replay-wave4-combat.png`／`-2.png`、`phone-relay-replay-four-waves-complete.png`；返回與重載見 `phone-relay-original-after-replay.png`、`phone-relay-original-return-reloaded.png`。R3 替代解／重載當次回歸圖另列於 `supplementary-regression.json`。`phone-terrain-replay-compare.png` 明列配置及實際攔下／耐久差異；涉水延遲與北路行軍分開，不用不同物理量相減；未經路段顯示「未涉水／未走北路」。

精選集限 15 張，三項各 5 張，原圖逐位元組複製。15 張無法同時容納五題各兩態、全部分支、收據兩態及所有三格，完整回歸原圖仍逐項保留；沒有用拼圖或縮圖偷加張數。

## 測試與產物

VERIFIED：`npm run verify` exit 0；145 項單元測試與既有主流程／美術／R1～R8 均通過。R9 為 887 項斷言、122 張原尺寸圖，無執行錯誤或外部請求。另跑 `npm run test:content:r9:proof`：13 項斷言、10 張圖，實際打完完整四波重演、返回原戰局並重載，錢包及原戰局不變。測試及來源存檔副本見 `verification/`；歷史 2398 個已追蹤文件／圖檔逐檔還原並核對雜湊。

VERIFIED：並發負載 RAF 參考量測，12 次、每次 180 格；flood 1366×600：p95 三跑中位 16.80ms；flood 320×568：p95 三跑中位 16.80ms；hollow 1366×600：p95 三跑中位 16.80ms；hollow 320×568：p95 三跑中位 16.80ms。門檻 18ms；不是乾淨機或實體 iOS 保證。原始資料見 `performance.json`。

VERIFIED：手機 320×568／430×932、橫式 844×390、iPad 1032×1376／1376×1032 的無頭觸控可達、≥44px、無溢出及手機無鍵盤提示均通過；另有既有 1366×600 矮桌機矩陣。建置 SHA-256：`7bf8213468d2d73b9712aa5e1144c21cb6b21dd8189b5519e481441f6e840b9a`。

新增單元測試核對同場原始命中與逐塔加總、不可變首波、同配置非零留塔重演、持久化拆晶收據、畸形資料拒收、補位說明及自選提示。既有 R7／R8 的「輔助關閉須隱藏狀態」斷言改成更完整的新契約：箭頭確實關閉，防線與第幾波狀態必須可見；沒有刪測試或放寬數值。

VERIFIED：最終秘密掃描零命中；收據見 `verification/secret-scan.json`。`verification/` 的 R1～R8 報告保留當次執行紀錄；原位置歷史圖檔已還原，當次交付原圖以 R9 清單與雜湊為準。

商店新增真實 DPR 擷取：`docs/store/screenshots/iphone-content-r9-flood-1290x2796.png`、`docs/store/screenshots/ipad-content-r9-flood-2064x2752.png`。既有商店圖與歷史測試輸出逐檔備份、驗證後還原。

新增美術 **0 張**：沿用 `image_gen__imagegen` 原畫，沒有本輪生成呼叫。道路、水面取樣、塌石木柵、河谷、留守塔及真四步姿勢來源與雜湊見 `art/manifest.json`；沒有新方塊、色塊或 emoji 冒充美術。

## 文案修改（speak-human-tw mode 2）

| 原句 | 原因 | 改成什麼 |
|---|---|---|
| 戰役實戰／獨立重演 | 容易把不同配置當成同一場 | 第 N 場・本場實際／重打本場；另標配置是否相同 |
| 中央遠哨打不到北折，外沿火力少了一座 | 未展開就公布解法 | 首漏敵軍、路段與生命；自行展開塔位提示 |
| 再建需 100 結晶還差 100 結晶 | 重複且混用演習貨幣 | 需 100，還差 100；頂部統一演習餘額 |
| 兩邊未經過的地形仍寫 0 | 混淆未經過與實測為零 | 未涉水／未走北路 |
| 石脊拆晶 +90 已入庫 | 無法對帳 | 原餘額＋退回 90＝入帳後餘額，並列目前餘額 |

## 未完成與風險

**Apple 4.3 風險：中（內容差異自評，非平台結論）。** 保留留塔跨場、改路布防、固定預算留空的本作特徵；核心仍為元素塔防。維持 MIT、免費、無廣告、無內購、無帳號、無第三方 SDK 及離線玩法。

BLOCKED：實體 iPhone／iPad 直橫、真實觸控與冷啟需要真機與測試人員；真人／親子試玩及音效聽感需要實際參與者；乾淨機效能需要不受其他線路影響的設備。效能僅提供本機並發負載下 RAF 參考值，不冒稱實體 iOS 保證。Muse 8 分以上需要獨立複審，本次沒有對外派工，也不自行冒評達標。
