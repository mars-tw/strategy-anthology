# 來源與授權

## 0.6.0／R5 渡橋比例與三相軍令

2026-10-18，使用者授權本輪新美術。17 張生成母版由內建 **image_gen__imagegen** 產出；工具未提供底層模型 slug，記 `actualModelSlug=null`，不推測 gpt-image 版本。沒有外部派工、圖庫、憑證或 API fallback。來源／提示／後製／SHA-256 見 docs/art/PROMPTS_R5.json、ASSET_MANIFEST_R5.json。

母版包含五職業正側背設定表、六套 4×6 真姿勢、河谷地表、兩版橋（窄版淘汰保留）、三甲犬配件、面板、女將重畫、塔卡特寫、元素圖示、Logo 與 App 圖示提案。實際工具生成 alpha 保留；Pillow 僅做裁切、固定縮放、色彩調整、遮罩見證與 PNG／WebP 壓縮。橋的護欄分段壓縮以增加俯視橋面占比。沒有程序化人物或單圖晃動補幀。

原圖位於 docs/art/r5/sources/，設定表另存 docs/art/character-sheets/r5-units.png；執行素材 public/assets/r5/。正向為新繪，左向為鏡像衍生，非多方向重畫。原 MIT 素材、授權、來源記錄與歷史母版完整保留；新圖沒有冒用第三方作品授權。Wesnoth 只作技法研究，沒有複製其圖像。

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

村莊來源文件將歷史原畫記為專案專用的 OpenAI built-in image_gen 產物，未揭露精確模型 slug。整合輪 0.1.0 沒有生成新點陣圖；此歷史來源聲明不變，正式送審原始紀錄仍應由帳號持有人保管。

## 0.2.0／R1 專屬美術

2026-10-16 使用 OpenAI 內建工具 `image_gen__imagegen` 實際生成八張母版：松林礦彩山河背景、火冰雷祭塔圖集、松林女指揮官、軍令板紋理、三相印章圖集、三相邊境 Logo、App 圖示提案、友軍城鎮／兵營／灰旗據點圖集。供本專案使用，依本 repo 的 MIT 發行安排納入；不宣稱 AI 產物在所有司法管轄區具有排他著作權。沒有新增第三方外部圖庫。

工具沒有回報實際模型 slug，故 `actualModelSlug: null`，實際工具名如上；requestedModelSlug 為 gpt-image-2，不冒稱已核對模型版本。完整提示、原始產出路徑與專案內原圖見 [PROMPTS.json](docs/art/PROMPTS.json)，逐檔雜湊、mask、RGBA、opaque 合成見 [R1 manifest](docs/art/ASSET_MANIFEST_R1.json)。透明產物已有原生 alpha，保留該 alpha 並清理不可見 RGB；opaque master 是灰底合成稽核檔，不是假稱模型先輸出該灰底。未進行不必要的 matte 反解。

28 張兵種／敵人 atlas 從既有 MIT 原圖產生調色衍生檔，原始 `public/assets/*.png` 與來源 repo 均未改寫。衍生圖的尺寸、alpha、4×6 真姿勢與 pivot 保持；只調整明度、飽和度與 PNG 色盤壓縮。原作授權、ATTRIBUTION 與來源雜湊全部保留。新指揮官僅是敘事立繪，沒有冒稱新增可操控兵種或動畫。

建置／測試依賴 esbuild（MIT）、Vitest（MIT）、Playwright（Apache-2.0）僅作本機工具；沒有把測試套件或其瀏覽器放入遊戲 runtime。系統字型由裝置提供，不隨包散布。沒有新增配樂，只有本機合成的統一短音。

## 0.3.0／R2 礦彩沙盤與輕軍令

2026-10-16，實際工具 `image_gen__imagegen` 新生成 **8 張母版**：礦彩戰場、短身女指揮官、鐵灰黑旗敵堡、礦紙面板、三相圖示圖集、Logo、App 圖示提案、石拱橋。供本專案使用並依本 repo MIT 發行安排納入；AI 產物不保證各地排他著作權。未使用外部圖庫或新字型包。底層模型 slug 工具未揭露，`actualModelSlug=null`，不以 requestedModelSlug `gpt-image-2` 冒充已驗證型號。

原圖與透明見證留於 `docs/art/r2/`，完整提示在 [PROMPTS.json](docs/art/PROMPTS.json) 的 secondRound／[PROMPTS_R2.json](docs/art/PROMPTS_R2.json)，雜湊與後製見 [R2 manifest](docs/art/ASSET_MANIFEST_R2.json)。導出 13 張遊戲用圖：背景暖／冷兩版、指揮官、敵堡、橋、面板、三圖示、Logo、三尺寸 App icon。原生透明保留並清理不可見 RGB，指揮官做有記錄的亮度／飽和修正；mask、RGBA、灰底 opaque 皆為稽核見證，不宣稱灰底是模型原始產物。

另從 R1 的 MIT 盾兵 atlas 產生 **6 張鐵藍敵軍配色衍生圖**，保持所有原姿勢、alpha 與命中格。28 張 R1 atlas、所有 R1 生成素材與原授權 master 均保留，不把這六張染色圖冒稱六張新生成原畫。透明裁切／顯示扇形塔位／環境流光是工程呈現，不是新增兵種或玩法。

## 0.4.0／R3 地貌與比例收尾

2026-10-16 使用 OpenAI 內建 `image_gen__imagegen` 生成 **11 張母版**：松林、河谷、石脊、高地四種地貌、乾淨礦紙、六件地形圖集、保留原身份的指揮官修訂、三元素圖示、題字 Logo、App icon 提案、土路表面材質。實際工具未提供底層模型 slug，故 actualModelSlug=null；未經 CLI／API 或外部派工。供本專案使用，依本 repo MIT 發行安排納入，不保證 AI 產物在各司法管轄區的排他著作權。

完整提示（含共同前綴）、來源與雜湊見 [PROMPTS_R3.json](docs/art/PROMPTS_R3.json) 與 [ASSET_MANIFEST_R3.json](docs/art/ASSET_MANIFEST_R3.json)。原圖、RGBA／mask／opaque 見證留在 docs/art/r3/；執行用圖 25 張，其中 22 張是生成母版的裁切／壓縮／時段衍生，3 張職業卡圖來自原 MIT atlas 的透明 bbox 裁切，不能算新生成角色。原生 alpha 保留，alpha<16 清零 RGB，指揮官另有記錄的飽和／亮度修正。

既有 28 張真幀 atlas、6 張鐵藍敵兵、塔、建築、石橋及所有歷史授權均保留。人類逐姿勢的顯示身高校正是工程呈現，沒有新增動畫原畫、三視圖或骨架；walk／attack／hurt／death 與命中結算不改。河谷／石脊收復章使用同地貌的明示時段衍生，並不冒稱六張獨立生成背景。

## 0.5.0／R4 角色設定與河谷工藝

2026-10-18 使用 OpenAI 內建 `image_gen__imagegen` 生成 **19 張母版**：女將設定表、四職業／陣營設定總表、衛士／弓手／術士／灰旗兵／工匠／甲犬六套真姿勢 atlas、松林與板岩河谷兩張地表、河道 cutout、道路 strip、女將立繪、三元素圖示 atlas、紙框、Logo、App icon 提案、三塔 atlas、三職業攻擊補繪 atlas。實際工具未揭露底層模型 slug，`actualModelSlug=null`；requestedModelSlug `gpt-image-2` 不視為型號證明。無 CLI／API fallback、外部圖庫、外部派工或字型包。

設定表位於 `docs/art/character-sheets/`；完整原始提示與參考角色表見 [PROMPTS_R4.json](docs/art/PROMPTS_R4.json)，逐檔來源、尺寸、雜湊、透明與編碼後色彩量測見 [ASSET_MANIFEST_R4.json](docs/art/ASSET_MANIFEST_R4.json)。第 18 張三塔用來移除實機仍可見的舊白盤；第 19 張補繪三職業攻擊，避免伸出的武器被格界裁掉。原圖全部保存於本 repo，不依賴外部生成資料夾。

產物供本專案使用，依本 repo MIT 發行安排納入；不宣稱 AI 產物於各司法管轄區擁有排他著作權。atlas 含 24 個實畫姿勢，Pillow 做裁切、行距重排、原生 alpha 清理與 HSV 調整，WebP 壓縮；沒有合成肢體。新原畫是一個右向 3/4 方向，左向由引擎鏡像，不能冒稱六方向新畫。河道截面貼合原深水核心與兩橋位置，屬原畫的幾何轉換，不是新玩法。

所有 MIT 原作檔、28 張歷史兵種 atlas、6 張鐵藍敵兵與各輪授權紀錄均保留不改；原 combat／命中與存檔規則保持。歷史文件中的「沒有三視圖」是當輪狀態，R4 設定表與新姿勢以本節及 R4 manifest 為準。
# R6 生成美術（2026-10-18）

本輪17張生成母版由 OpenAI 內建 `image_gen__imagegen` 產生；工具沒有回傳模型slug，因此未宣稱實際為特定gpt-image版本。提示、來源、SHA-256、透明遮罩、opaque檢查圖與出貨資產詳見 `docs/art/PROMPTS_R6.json`、`docs/art/ASSET_MANIFEST_R6.json`。3張為設定／未採用橋方案，14張母版接成18張runtime影像與2份幀資料。沒有新增外部商用圖片或字型；不宣稱生成圖有獨占著作權。

河谷、嵌岸拱橋、甲犬三種真步行姿勢、三職業完整武器肖像、指揮官、三相印、紙框、Logo與App圖示依同一礦彩／朱砂風格生成。三職業重畫全部六種狀態，甲犬只替換行軍幀，其餘受擊／倒地沿用R5；未把單圖位移當新動畫。R1至R5與MIT來源歷史授權完整保留。
# R7 美術更新（2026-10-18）

《三相邊境》本輪使用內建 **image_gen__imagegen** 產生 8 張原始母版。工具未回傳底層模型 slug，記為 null；未推測為任何指定 gpt-image 版本。提示、來源雜湊、未採用方案及衍生成品見 `docs/art/PROMPTS_R7.json`、`docs/art/ASSET_MANIFEST_R7.json`。

本輪新作：三職業／三狼兵正側背與動作設定、衛士／弓手圖集、術士兩版圖集（原六列方案因跨格未採用）、三變體狼兵步行、河谷地景、三種橋體。實際採用術士的 16 張新存活動作；死亡及慶祝沿用 R6 已授權真姿勢。卡面取自完整新角色／既有塔原畫，未增第三方素材。原始 RGBA、alpha mask、透明清理與中性底檢查圖皆留存。

沿用 R6 女將、三相印、Logo、面板與 App 圖示，及所有原有 MIT／第三方素材與授權條款；下列既有記錄完整保留。研究 Wesnoth 的輪廓、固定腳底、陰影與動畫方法，未移植該遊戲圖像。

# 新內容 R1 工事美術（2026-10-18）

路障、水閘與三印界碑為同一張透明圖集，由內建 **image_gen__imagegen** 實際產生，模型 slug 未回傳。`public/assets/content-r1/fieldworks.png` 保留生成原檔位元組，瀏覽器按三個來源區域取圖，沒有以程序色塊代替物件。提示、工具與 SHA-256 收據見 `docs/content/r1/art/`。沿用 PROMPTS_R7 的固定風格前綴；沒有新增第三方圖片、字型、SDK 或網路服務。不宣稱生成圖有獨占著作權；原有 MIT 與第三方授權完整保留。

# 新內容 R2 拆晶美術（2026-10-19）

空地基與結晶為一張透明原畫圖集，實際工具 **image_gen__imagegen**，模型 slug 未回傳，記為 null。`public/assets/content-r2/legacy.png` 保留生成 PNG 位元組；只在 Canvas／SVG 取來源區域，沒有重畫、染色或以幾何圖形冒充美術。固定風格前綴、提示、尺寸、alpha 與 SHA-256 見 `docs/content/r2/art/`。路障、水閘、界碑與角色沿用既有原畫，原有 MIT 與第三方授權完整保留。

# 新內容 R4 放水區原畫（2026-10-19）

新增一張透明淺池原畫，實際工具 **image_gen__imagegen**；模型 slug 未回傳，記為 null。完整生成 PNG 存 `docs/content/r4/art/flood-master.png`，等比縮小的 lossless WebP 存 `public/assets/content-r4/flood.webp`。提示逐字沿用 R7 風格前綴，工具及雜湊見 `docs/content/r4/art/`。既有塔、工事、角色與 MIT 授權保留；未新增第三方素材、字型或 SDK，不宣稱生成圖有獨占著作權。

# 新內容 R5 淹水土路原畫（2026-10-19）

新增一張不規則礦彩淺水／沙岸／車轍原畫，實際工具 **image_gen__imagegen**，模型 slug 未回傳。完整透明 PNG 為 `docs/content/r5/art/flood-original.png`，等比縮至 512px 的 WebP 為 `public/assets/content-r5/flood.webp`。保留 R7 風格前綴與舊圖，提示及 SHA-256 見 `docs/content/r5/art/`。水域不再疊加同心圓；原有 MIT 與第三方授權完整保留，未新增第三方服務。

# 新內容 R6 泥水與封路（2026-10-19）

新增 2 張透明生成母版，實際工具 **image_gen__imagegen**，底層模型 slug 未回傳。原始 PNG、逐字 R7 風格前綴、完整提示與 SHA-256 見 `docs/content/r6/art/`；兩張等比 640px lossless WebP 放在 `public/assets/content-r6/`。原圖 alpha 保留，未重畫或變造生成內容；既有 MIT 與第三方授權保留。命中形狀、水花與放大窗由原生 Canvas 繪製，角色取既有真姿勢，音效由本機 Web Audio 合成，不新增 SDK 或線上功能。

# 新內容 R7 繼承戰旗與涉水地表（2026-10-19）

新增 2 張透明原畫：帶修補石基與舊戰旗的繼承火塔、具明確泥岸與流紋的涉水土路。實際工具 **image_gen__imagegen**；模型 slug 未回傳，記為 null。逐字沿用 `docs/art/PROMPTS_R7.json` 的風格前綴。原始 PNG、提示、alpha、裁切範圍與 SHA-256 見 `docs/content/r7/art/`；執行素材存 `public/assets/content-r7/`。僅裁去透明外緣並等比縮小為 lossless WebP，沒有重畫。小地圖、命中圖例、單體雷擊折線與水花為原生 SVG／Canvas 介面圖形。保留既有 MIT 與第三方授權，沒有新增 SDK、字型、外部素材服務或連線功能。

# 新內容第12輪

潮閘水門原畫：本輪使用 `image_gen__imagegen` 生成，實際底層模型 slug 未回傳。提示、完整來源與 SHA-256 見 `docs/content/r12/art/manifest.json`。沿用本作礦彩山河／朱砂軍令風格，無新增第三方 SDK 或線上功能。
