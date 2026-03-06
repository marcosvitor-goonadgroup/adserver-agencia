export interface StructureItem {
  name: string;
  purchaseType?: string; // CPM | CPC | CPV (nível site/veículo)
  contracted: number;
  delivered: number;
  pacing: number;
  impressions: number;
  viewables: number;
  va: number;
  clicks: number;
  ctr: number;
  views: number;
  vtr: number;
  children?: StructureItem[];
}

export interface PurchaseGroup {
  type: string;       // "CPM" | "CPC" | "CPV"
  contracted: number;
  delivered: number;
  pacing: number;
}

/** Agrupa veículos por tipo de compra e calcula pacing por grupo */
export function computePurchaseGroups(structure: StructureItem[]): PurchaseGroup[] {
  const map: Record<string, { contracted: number; delivered: number }> = {};
  for (const site of structure) {
    const type = site.purchaseType || "CPM";
    const delivered =
      type === "CPC" ? site.clicks :
      type === "CPV" ? site.views :
      site.impressions; // CPM
    if (!map[type]) map[type] = { contracted: 0, delivered: 0 };
    map[type].contracted += site.contracted;
    map[type].delivered  += delivered;
  }
  return Object.entries(map).map(([type, v]) => ({
    type,
    contracted: v.contracted,
    delivered:  v.delivered,
    pacing: v.contracted > 0 ? Math.round((v.delivered / v.contracted) * 100) : 0,
  }));
}

/** Retorna o item com valores somados a partir dos filhos (se existirem).
 *  contracted vem sempre do pai (definido no nível de site/veículo pela planilha).
 */
export function aggregateItem(item: StructureItem): StructureItem {
  const children = item.children;
  if (!children || children.length === 0) return item;

  const delivered   = children.reduce((s, c) => s + c.delivered, 0);
  const impressions = children.reduce((s, c) => s + c.impressions, 0);
  const viewables   = children.reduce((s, c) => s + c.viewables, 0);
  const clicks      = children.reduce((s, c) => s + c.clicks, 0);
  const views       = children.reduce((s, c) => s + c.views, 0);

  const va  = impressions > 0 ? (viewables / impressions) * 100 : 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const vtr = impressions > 0 ? (views / impressions) * 100 : 0;
  const pacing = item.contracted > 0 ? Math.round((delivered / item.contracted) * 100) : 0;

  // contracted fica no pai — não é somado dos filhos (filhos têm contracted: 0)
  return { ...item, delivered, impressions, viewables, clicks, views, va, ctr, vtr, pacing };
}

/** Retorna os totais consolidados de todos os veículos (já agregados) */
export function computeTotals(structure: StructureItem[]) {
  const vehicles = structure.map(aggregateItem);

  const contracted  = vehicles.reduce((s, v) => s + v.contracted, 0);
  const delivered   = vehicles.reduce((s, v) => s + v.delivered, 0);
  const impressions = vehicles.reduce((s, v) => s + v.impressions, 0);
  const viewables   = vehicles.reduce((s, v) => s + v.viewables, 0);
  const clicks      = vehicles.reduce((s, v) => s + v.clicks, 0);
  const views       = vehicles.reduce((s, v) => s + v.views, 0);

  const pacing      = contracted > 0 ? Math.round((delivered / contracted) * 100) : 0;
  const viewability = impressions > 0 ? (viewables / impressions) * 100 : 0;
  const ctr         = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const vtr         = impressions > 0 ? (views / impressions) * 100 : 0;

  return { contracted, delivered, impressions, viewables, clicks, views, pacing, viewability, ctr, vtr };
}
