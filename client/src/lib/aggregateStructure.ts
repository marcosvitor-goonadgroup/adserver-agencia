export interface StructureItem {
  name: string;
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

/** Retorna o item com valores somados a partir dos filhos (se existirem) */
export function aggregateItem(item: StructureItem): StructureItem {
  const children = item.children;
  if (!children || children.length === 0) return item;

  const contracted  = children.reduce((s, c) => s + c.contracted, 0);
  const delivered   = children.reduce((s, c) => s + c.delivered, 0);
  const impressions = children.reduce((s, c) => s + c.impressions, 0);
  const viewables   = children.reduce((s, c) => s + c.viewables, 0);
  const clicks      = children.reduce((s, c) => s + c.clicks, 0);
  const views       = children.reduce((s, c) => s + c.views, 0);

  const va  = impressions > 0 ? (viewables / impressions) * 100 : 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const vtr = impressions > 0 ? (views / impressions) * 100 : 0;

  return { ...item, contracted, delivered, impressions, viewables, clicks, views, va, ctr, vtr };
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
