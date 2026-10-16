import type { GameCommand, ResourceKind, VisibleSnapshot } from "@village-siege/shared";

export type ArmyRoute = "keep" | "home" | "ford" | "scout";
export interface FieldPlan { readonly economy: ResourceKind | "keep"; readonly army: ArmyRoute }
export const ARMY_ROUTES = { home: { x: 10, y: 12 }, ford: { x: 16, y: 12 }, scout: { x: 22, y: 8 } } as const;
export interface PlannedOrder { readonly lane: "economy" | "army"; readonly label: string; readonly command: GameCommand }

/** Plans use only live recipient-visible information. No grants or fog inspection. */
export function planFieldOrders(view: VisibleSnapshot, plan: FieldPlan): { orders: PlannedOrder[]; warnings: string[] } {
  const orders: PlannedOrder[] = [], warnings: string[] = [];
  if (view.phase !== "playing") return { orders, warnings: ["戰局已結束。"] };
  const own = view.entities.filter(e => e.ownerId === view.recipientPlayerId && e.kind === "unit" && e.hitPoints > 0);
  if (plan.economy !== "keep") {
    // Preserve builders, repairers and loaded workers instead of interrupting work.
    const workers = own.filter(e => e.typeId === "villager" && !e.cargo?.amount && (e.civilianActivity === "idle" || e.civilianActivity === "gathering"));
    const visible = new Set(view.visibleEntityIds);
    const source = view.entities.filter(e => e.kind === "resource" && e.typeId === plan.economy && (e.resourceNode?.amount ?? 0) > 0 && visible.has(e.id))
      .sort((a, b) => Math.hypot(a.position.x - 4, a.position.y - 11) - Math.hypot(b.position.x - 4, b.position.y - 11))[0];
    if (workers.length && source) orders.push({ lane: "economy", label: "工匠轉往採集", command: { type: "gather", entityIds: workers.map(e => e.id), targetId: source.id } });
    else warnings.push(workers.length ? "視野內沒有這種資源。" : "沒有可調度的工匠；施工、返程與卸貨中的工匠會留在原工作。" );
  }
  if (plan.army !== "keep") {
    const army = own.filter(e => e.typeId !== "villager");
    if (army.length) orders.push({ lane: "army", label: "軍隊依路線行軍", command: { type: "move", entityIds: army.map(e => e.id), target: ARMY_ROUTES[plan.army] } });
    else warnings.push("還沒有士兵；先建造兵營並訓練軍隊。" );
  }
  return { orders, warnings };
}
