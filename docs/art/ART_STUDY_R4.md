# R4 來源技法與落地

唯讀研究本 repo vendor/village-siege 的 combat.ts／ATTRIBUTION.md、既有 MIT 4×6 六動作 atlas 與 engine.animationFrame；tower-defense 的 config／rules 保留真射程與共鳴。沒有外部素材下載。

- 原作真幀：idle／walk／attack／hurt／death／cast 六列，每列四姿勢。新 atlas 仍按此契約，攻擊第 2 格（0 起算）為命中，預備／揮擊／復位肢體要變，不能用單圖位移冒充。
- 原作方向量化與命中計算保留。新素材先以設定表鎖 3 頭身、頭盔臉、武器與三主色，再輸出右向 3/4 真姿勢；左向以鏡像衍生並明示，不能冒稱六方向新原畫。
- 沙盤採同一左上光，塔基壓土與影子沿地面扁橢圓，河道形狀需跨兩個原合法渡點；不可改碰撞、資源、敵數或數值來配美術。
- 紙底保留乾淨承字區，纖維與朱砂只留邊框。大盾／彎弓／分叉法杖比細節更能在 64px 分出職業。
