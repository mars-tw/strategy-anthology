# App Review notes — local draft

PREPARED, not submitted. This document describes the local web implementation of Trine Frontier 0.1.0. No signed iOS binary or device verification has been produced in this round.

## Product and review route

Trine Frontier is one single-player campaign about reconnecting three frontier settlements. It combines the elemental adjacency rules of our MIT project Endless Tower Defense with worker supply and army command concepts from our MIT project Village Siege. It has one world, one campaign save, one crystal wallet, one settings screen and a shared renderer. There is no catalog of separate games, iframe or online login.

1. Launch and tap the single campaign button. The opening explains the lost river crossing and immediately enters the defense of Pine Village.
2. Select Fire, Ice and Thunder towers, and confirm each placement. The suggested cells are mutually adjacent; the actual shared resonance rule gives each tower +30% damage. Start the wave and defend two waves. The wave button becomes available again between waves.
3. Continue to the river crossing assault. The crystals earned in defense persist. Defense unlocks archers; finishing with a trinity formation also unlocks mages.
4. Build the barracks, train troops, open Dual Orders to pause and plan the worker and army lanes, then confirm. Workers physically return supplies to the same wallet. Tap the battlefield or the army assault button to attack the enemy keep.
5. After taking the crossing, the next chapter defends that same river terrain. Progress and an unfinished battle can be resumed after reopening. Complete all six chapters to conclude the campaign.

Settings are shared across the campaign. A confirmed hit is required for the crystal shock skill to consume resources. The local web version supports phone and tablet portrait/landscape layouts. Offline use requires a complete initial load and a ready Service Worker; native offline packaging remains pending.

## 中文對照

三相邊境是一條重新連接三處邊境聚落的單人戰役。它整合兩個 MIT 原作的元素相鄰共鳴與工匠補給、軍隊指揮，使用同一世界、同一存檔、同一結晶錢包與共同設定／繪圖介面。沒有各自獨立的遊戲目錄或 iframe。

啟動後按唯一戰役入口，立即進入松林守城。依序選火冰雷並確認建造，建議格位彼此相鄰，實際傷害各加 30%。守完兩波後直接反攻渡口，沿用結晶與解鎖的兵種。建兵營、訓練部隊，以雙線軍令同時安排工匠與軍隊，攻下據點後下一章就在同一片渡口地形守城。六章後主線完結。設定、暫停、命中才消耗技能與中途存檔均共用。

## Rejection response evidence and missing facts

We are proposing consolidation into one existing product record rather than resubmitting both original apps. See DIFFERENTIATION.md for the six other planned products and BUNDLE_STRATEGY.md for the recommendation. This is a product restructuring proposal, not a claim that Guideline 4.3 or 4.2.6 concerns have been resolved.

- Intended audience: players who enjoy short strategic defense and army planning. This is a design target, not a player research result.
- Beta feedback: no TestFlight or human beta feedback was collected in this local round. Automated headless tests are not beta participants or testimonials.
- Shared code and content: tower rules/configuration, Village Siege combat/field order modules, and licensed Village Siege artwork are itemized with SHA-256 in ASSET_MANIFEST.json and CREDITS.md. The new shell, campaign, save system and combined simulation are in this repository. Standard build/test tools are esbuild, Vitest and Playwright; no third-party runtime framework or remote SDK is bundled.
- Content provider/submitting account relationship and any client/partner involvement: the account owner must provide the true statements and supporting records. This draft does not invent ownership, employment or commission history.
- Existing game saves: opt-in import preserves the original input and gives bounded crystal/archer progression. It does not resume incompatible original free battles, heroes or technology trees.
- Native and policy evidence still needed: signed final binary, physical iPhone/iPad testing, aggregate privacy review, actual support/privacy URLs, age rating, content rights records and live account statements.

中文：此次建議把兩個原作合為一項既有產品更新，未宣稱 4.3／4.2.6 已解除。尚無真人 beta、最終原生二進位與實機證據；內容提供者／提交者及受託關係需帳號持有人如實補充。原始程式與素材逐項揭露，不能把共用來源說成毫無關聯的兩款作品。
