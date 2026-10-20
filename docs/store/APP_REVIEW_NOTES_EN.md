# Trine Frontier 2.0.0 — App Review response draft

PREPARED, NOT SENT. Prepared October 20, 2026. This is an update to Village Siege, App ID `6819988533`, bundle ID `tw.mars.villagesiege`. Planned native version: 2.0.0, build 3. Web source: `268512f6f84f0b8585a5570d5f6feb6092c24f0b` (0.19.0). A prepared source package is not evidence of a signed or uploaded iOS build. Current binary/upload status is recorded separately by the publishing workflow.

The statements about my identity, authorship and personal playtesting below were supplied by me as the account owner. Automated test results are a separate form of evidence. No reviewer message has been answered by preparing this file. The historical `REVIEW_NOTES_EN.md` describes an earlier web-only round; this file is the current response draft.

## Developer and content provider

I am 方士軒 (Shih-Hsuan Fang), an individual developer and the content provider submitting this game. I lead its design, write and approve its story, and personally playtest every version. I create the game in collaboration with AI tools, including assistance with programming and some artwork. The story and characters are original to my project; licensed material inherited from my earlier projects is disclosed rather than presented as newly made for this update.

The asset and tooling disclosures in `CREDITS.md` control the detailed attribution. Artwork records identify OpenAI's built-in image generation tool; the tool did not disclose an underlying model slug, so I do not claim a particular model version. Current credits record no new background music and describe short Web Audio synthesized sounds. I therefore do not claim that this game contains newly AI-generated music. MIT notices and the original projects' attribution are retained.

## 1. What does the app do, and what problem does it address?

Trine Frontier turns two former separate strategy games into one six-chapter, single-player campaign. Players defend Pinewood with adjacent fire, ice and lightning towers, spend the resulting crystals on workers and troops, retake a river crossing, and defend the recovered terrain in a later chapter. One save, crystal wallet and set of controls connect the sequence. Players can pause, preview construction before payment, and plan supply and army routes together. It addresses a concrete continuity problem in the former separate products: defense results and army planning now affect the same campaign instead of ending in unrelated modes.

The current update adds retained-or-salvaged fieldworks after conquest, pre-battle road or flood choices, and five fixed-budget Three-Seal Drill challenges. Battle reports compare recorded first-wave outcomes and allow an isolated replay of another branch without duplicating campaign rewards.

## 2. Who are the intended users?

Players who enjoy elemental tower placement, resource allocation and short army-command scenarios. This is a design audience, not a measured audience or a claim about user demographics. It is not submitted as a Made for Kids educational app.

## 3. What need does it address that existing apps do not?

I cannot substantiate that no other App Store game meets this need. My specific design combines adjacent elemental resonance, physical worker return trips, a shared economy, and attack-to-defense terrain continuity. The fieldwork and first-wave comparison systems make a prior decision visible in a later battle. These are demonstrable characteristics of this implementation, not a market-first claim or proof that the app satisfies Guideline 4.3.

## 4. What beta testing was done, and how did feedback improve the app?

I personally playtest each version. The repository also includes deterministic unit and headless-browser tests for campaign completion, touch controls, save/reload, imports, construction cancellation and the current fieldwork/report systems. Development revisions address road-queue movement, tower-slot labels and the visibility of recorded outcomes; their implementation and test evidence are recorded in the content-round documents.

No verified external TestFlight feedback or external beta participant count is available in this release packet. My own playtesting and automated checks must not be described as external beta feedback. I cannot supply a beta testimonial or participant count that has not been collected. External beta feedback and physical iPhone/iPad testing remain items to obtain before a reviewer response or resubmission that depends on them.

## 5. Is this independent, or part of a series? How does it differ from the account's other apps?

It is one consolidated strategy product, not a launcher containing separate games. The account also contains other projects and historical records. The comparison below describes their documented scope, not fresh device testing or their current store availability.

| Account project / historical record | Difference and overlap |
|---|---|
| Village Siege | This is the same product record, now receiving the consolidated campaign. It is not an additional parallel submission. |
| Endless Tower Defense | Its elemental defense rules are incorporated here. I will not resubmit it as a separate Apple app. Its old store record is not deleted by this work. |
| Island Transport Academy | Driving, flight, railway and number-learning activities; this game uses combat placement and army supply, without transport lessons. |
| Island Flight School | A historical flight-learning record; no flight-learning activity appears here. |
| Island Railway School | A historical railway-learning record; no railway-learning activity appears here. |
| Little Train Conductor | A historical train/counting-learning record; this game has no counting curriculum. |
| Ashes Convoy / Emberline: Last Haven | Documented survival/escort content, consolidated with other apocalypse projects; this game centers on frontier terrain, elemental towers and worker/army orders. Resource defense remains an overlap. |
| Storm Apocalypse | Historical apocalypse/action-defense content; defense overlaps, but its action/survival loop is not this six-chapter supply campaign. |
| Night Train: Watch Protocol | Historical train-watch/survival content; this game has no train-watch loop. |
| Crackveil Vanguard | Documented squad-formation action combat; this game uses tower adjacency and orders to multiple units instead of directly controlling an action character. |
| Cracktide Cards | Card/deck-based play; this game has no draw/deck-turn economy. |
| Sunshine Farm | Farming/idle progression; this game's worker trips are part of an active battle economy, without idle farming rewards. |
| Seven District: Broken Link | Local narrative/third-person investigation; this is a 2D frontier campaign driven by battlefield decisions. |
| Rift Forge 3D / Rift Forge: Phase Imprints | Its local listing draft describes direct movement, melee attacks, timed dodges that leave imprints, and bursts that trigger earlier positions. This game's fixed-tower placement and worker/army orders do not use that direct-action loop. This comparison comes from `rift-forge-3d/docs/store/LISTING_ZH_TW.md`, not a fresh test of its binary. |

This comparison does not assert that all code or art is unique. Shared elements are disclosed below. The owner must reconcile this list with the live account inventory before sending it.

## 6. Could this be an expansion or update of another account app? Why not consolidate?

Yes. I have consolidated Endless Tower Defense and Village Siege into this update of the existing Village Siege record, keeping `tw.mars.villagesiege`. They share one continuous campaign, save and wallet rather than two independent game entries or iframes. Endless Tower Defense will not be independently resubmitted to Apple. This is not an IAP pack; the current game includes no purchases. No other historical app is withdrawn or changed by this packet.

## 7. Does the binary share significant code, frameworks or assets with other account apps?

Yes. The inherited tower data/rules and regression tests come from the MIT Endless Tower Defense project. Combat, damage/direction and field-order modules come from the MIT Village Siege project. Licensed building, terrain and character assets are also inherited from Village Siege; subsequent project-specific generated art and its derivations are documented in `CREDITS.md` and the art manifests. The combined campaign, save/import layer and decision/report systems live in this repository.

The native package retains the Capacitor shell and host lifecycle/service-worker handling used by the publishing toolchain. The native payload is rebuilt from this repository; the old Village Siege payload and its old layout patch must not be included. A shared wrapper is not evidence that the game logic and content are wholly unique. Source origins and hashes are itemized in `docs/ASSET_MANIFEST.json`, the art manifests, and the release source/payload manifests.

## 8. Is code, an SDK or a content library shared with third-party apps?

The native runtime uses standard Capacitor core, App and Preferences plugins from the existing shell. The game stores campaign data locally; including the Preferences plugin does not add a remote save service. MIT source notices for the two original projects and generated-art provenance are retained. esbuild, Vitest and Playwright are build/test tools, not game content or a third-party app-generation/content feed. The current game includes no advertising or analytics SDK, remote content API, or embedded catalogue of third-party games. Shared open-source tools may be used by other apps; I do not claim exclusive ownership of them or of AI-generated output.

## 9. Was this made for a client or partner?

This is my own game project, submitted by me as an individual content provider, rather than an app submitted for a customer. I direct and approve its design and story and personally test its versions. AI tools assist my production process; they are not a separate client or the submitting content provider. I retain responsibility for the submitted content and the rights disclosures in the credits.

## Reviewer navigation and remaining evidence

Launch → campaign button → select fire/ice/lightning → confirm towers → start wave. Adjacent elemental towers increase damage by 30%. After the defense, continue to the crossing; build a barracks, train troops and use Dual Orders. Later chapters expose retained fieldworks and pre-battle road choices. The title screen's Three-Seal Drill is a fixed-budget challenge, not another bundled app. Progress import is optional and requires preview and confirmation; it does not restore incompatible old battles or guarantee automatic native-save migration.

Before this text is sent, obtain actual external beta feedback if required, verify the signed device build and current native scenes, publish and read back the privacy/support pages, and reconcile age rating/privacy answers. This draft does not claim that Apple has accepted the consolidation or that the 4.3/4.2.6 concerns are resolved. Do not submit or reply merely because this file exists.
