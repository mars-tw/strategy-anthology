# R4 水域及操作標記研究

沿用已讀取的 `docs/art/ART_DIRECTION.md` R7 正本及同一 `PROMPTS_R7.json.stylePrefix`。參考本機 MIT 塔防的元素色／射程分離規則（`vendor/tower-defense/src/config.js`、`vendor/tower-defense/src/rules.js`），以及本作既有礦彩地景、`src/presentation-r7.js` 的腳底與投影。未下載或移植新第三方圖像。

落地：放水區需要在 430／320 寬靜圖中仍可辨為水，不依賴半透明純色圓。新增一張青瓷淺池原畫，保留暖墨岸線、蘆葦、淡色波紋與左上光。出貨衍生為原 RGBA 等比縮小的 lossless WebP，原 PNG 不變；實際慢行碰撞仍由既有世界圓判定，岸線是貼圖外緣，Canvas 明線表示精確遊戲邊界。波紋屬操作回饋，不宣稱新增物理模擬。

界碑使用既有實體印石，編號圓牌及白底雙線為操作資訊，不冒充新美術；相同編號同時標在實際塔位、下緣短名牌。已部署塔卡保留原塔彩圖，以綠色狀態底、砂色再建成本底分開語意。繼承工事使用既有冰塔原畫與額外雙線地面框，保持名實一致的一級固定工事。

新原畫實際工具 `image_gen__imagegen`，底層模型 slug 未回傳，不推稱指定型號；完整提示及原圖／runtime 路徑見 `PROMPTS.json`。實體手機、真人辨識及 Muse 分數未在本機取得。
