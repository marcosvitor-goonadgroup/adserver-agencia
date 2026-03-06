import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { MetricsCard } from "@/components/MetricsCard";
import { StructureTable } from "@/components/StructureTable";
import { DailyDeliveryChart } from "@/components/DailyDeliveryChart";
import { GeographicMap } from "@/components/GeographicMap";
import { computeTotals, computePurchaseGroups, type StructureItem, type PurchaseGroup } from "@/lib/aggregateStructure";
import {
  fetchCampaigns,
  fetchCampaignReport,
  fetchCampaignViewability,
  fetchCampaignVast,
  fetchSheetCampaignData,
  type Campaign,
  type CampaignReport,
  type ReportAd,
  type ReportDay,
  type ViewabilityRow,
  type VastRow,
  type SheetCampaignRow,
} from "@/lib/api";

interface ChartPoint {
  date: string;
  delivery: number;
  viewability: number;
}

interface GeoPoint {
  state: string;
  value: number;
  color: string;
  inLegend?: boolean;
  intensity?: number;
}

interface DashboardData {
  campaign: {
    title: string;
    period: string;
    agency: string;
    client: string;
    auditStatus: { percentage: number; verifier: string };
  };
  structure: StructureItem[];
  chartData: ChartPoint[];
  geoData: GeoPoint[];
  purchaseGroups: PurchaseGroup[];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 10).split("-").reverse().join("/");
}

function sumDays(days: ReportDay[]) {
  let impressions = 0, views = 0, clicks = 0;
  for (const day of days) {
    if (!day.stats) continue;
    impressions += day.stats.impressions;
    views       += day.stats.views;
    clicks      += day.stats.clicks;
  }
  return { impressions, views, clicks };
}

function sumZoneDays(days: ReportDay[], zoneId: number) {
  let impressions = 0, views = 0, clicks = 0;
  for (const day of days) {
    const zone = day.zones.find((z) => z.zone_id === zoneId);
    if (!zone?.stats) continue;
    impressions += zone.stats.impressions;
    views       += zone.stats.views;
    clicks      += zone.stats.clicks;
  }
  return { impressions, views, clicks };
}

// Cores em tons de azul da marca
const GEO_COLORS = ["#153ece", "#1e4fe0", "#3b6ef5", "#6090f8", "#93b5fb", "#bdd3fd"];

// Mapeamento nome completo do estado → sigla (retornado pelo ip-api em pt-BR)
const ESTADO_SIGLA: Record<string, string> = {
  "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM",
  "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF",
  "Espírito Santo": "ES", "Goiás": "GO", "Maranhão": "MA",
  "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG",
  "Pará": "PA", "Paraíba": "PB", "Paraná": "PR", "Pernambuco": "PE",
  "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
  "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR",
  "Santa Catarina": "SC", "São Paulo": "SP", "Sergipe": "SE",
  "Tocantins": "TO",
  // Variações encontradas no BQ (ip-api retorna às vezes com prefixo "Estado de/da")
  "Estado de São Paulo": "SP", "Estado do Rio de Janeiro": "RJ",
  "Estado de Minas Gerais": "MG", "Estado da Bahia": "BA",
  "Estado do Paraná": "PR", "Estado do Rio Grande do Sul": "RS",
  "Estado de Santa Catarina": "SC", "Estado de Goiás": "GO",
  "Estado do Pará": "PA", "Estado do Ceará": "CE",
  "Estado de Pernambuco": "PE", "Estado do Maranhão": "MA",
  "Estado do Amazonas": "AM", "Estado do Mato Grosso": "MT",
  "Estado do Mato Grosso do Sul": "MS", "Estado do Espírito Santo": "ES",
  "Estado de Alagoas": "AL", "Estado da Paraíba": "PB",
  "Estado do Rio Grande do Norte": "RN", "Estado de Sergipe": "SE",
  "Estado de Rondônia": "RO", "Estado do Piauí": "PI",
  "Estado do Tocantins": "TO", "Estado do Amapá": "AP",
  "Estado de Roraima": "RR", "Estado do Acre": "AC",
};

function buildGeoData(vastRows: VastRow[], viewRows: ViewabilityRow[]): GeoPoint[] {
  // Combina VAST (vídeo) + Viewability (display) para cobertura geográfica completa
  const stateMap: Record<string, number> = {};
  for (const row of vastRows) {
    const sigla = ESTADO_SIGLA[row.region ?? ""];
    if (!sigla) continue;
    stateMap[sigla] = (stateMap[sigla] || 0) + (Number(row.Impression) || 0);
  }
  for (const row of viewRows) {
    const sigla = ESTADO_SIGLA[row.region ?? ""];
    if (!sigla) continue;
    stateMap[sigla] = (stateMap[sigla] || 0) + (Number(row.Viewable) || 0);
  }
  const total = Object.values(stateMap).reduce((s, v) => s + v, 0) || 1;
  const sorted = Object.entries(stateMap).sort(([, a], [, b]) => b - a);
  const maxValue = sorted[0]?.[1] ?? 1;
  // Todos os estados com dados ficam no mapa; legenda mostra top 6
  return sorted.map(([sigla, value], i) => ({
    state: sigla,
    value: Math.round((value / total) * 100),
    color: GEO_COLORS[Math.min(i, GEO_COLORS.length - 1)],
    inLegend: i < 6,
    // opacidade proporcional ao valor máximo para gradiente visual
    intensity: value / maxValue,
  }));
}

// Viewable acumulado por Zone_ID
function buildViewabilityIndex(viewRows: ViewabilityRow[]): Record<string, number> {
  const idx: Record<string, number> = {};
  for (const row of viewRows) {
    const k = String(row.Zone_ID);
    idx[k] = (idx[k] || 0) + (Number(row.Viewable) || 0);
  }
  return idx;
}

// Contratado por veículo (site name) vindo da planilha
function buildContractedIndex(sheetRows: SheetCampaignRow[]): Record<string, number> {
  const idx: Record<string, number> = {};
  for (const row of sheetRows) {
    const k = (row.vehicle || "").toLowerCase().trim();
    if (k) idx[k] = (idx[k] || 0) + row.contracted;
  }
  return idx;
}

// Tipo de compra por veículo
function buildPurchaseTypeIndex(sheetRows: SheetCampaignRow[]): Record<string, string> {
  const idx: Record<string, string> = {};
  for (const row of sheetRows) {
    const k = (row.vehicle || "").toLowerCase().trim();
    if (k && row.purchaseType) idx[k] = row.purchaseType.toUpperCase();
  }
  return idx;
}

function buildDashboardData(
  campaign: Campaign,
  report: CampaignReport,
  sheetRows: SheetCampaignRow[],
  viewRows: ViewabilityRow[],
  vastRows: VastRow[],
): DashboardData {
  // Agência e datas: da planilha (match por nome de campanha) ou fallback para adserver
  const matchingSheet = sheetRows.find(
    (r) => r.campaign.toLowerCase().includes(campaign.name.toLowerCase()) ||
           campaign.name.toLowerCase().includes(r.campaign.toLowerCase())
  );
  const agency = matchingSheet?.agency || campaign.advertiser.name;

  const startAt = formatDate(campaign.limits.start_at) || matchingSheet?.dateBegin || "";
  const finishAt = formatDate(campaign.limits.finish_at) || matchingSheet?.dateEnd || "";
  const period = startAt && finishAt ? `${startAt} - ${finishAt}` : "—";

  const contractedIdx = buildContractedIndex(sheetRows);
  const purchaseTypeIdx = buildPurchaseTypeIndex(sheetRows);
  const viewIdx = buildViewabilityIndex(viewRows);

  // Total contratado da planilha para esta campanha
  const totalContractedSheet = sheetRows.reduce((s, r) => s + r.contracted, 0);
  const limitTotal = totalContractedSheet > 0
    ? totalContractedSheet
    : (campaign.limits.additional?.limit_total ?? 0);

  const structure: StructureItem[] = report.sites.map((site) => {
    const siteStats = sumDays(site.days);
    const imp = siteStats.impressions;
    const clk = siteStats.clicks;
    const viw = siteStats.views;

    // Collect unique zones with their ads (use first day that has them)
    const zoneMap: Record<number, { name: string; ads: ReportAd[] }> = {};
    for (const day of site.days) {
      for (const zone of day.zones) {
        if (!zone.zone_id) continue;
        if (!zoneMap[zone.zone_id]) {
          zoneMap[zone.zone_id] = { name: zone.zone_name || "", ads: zone.ads || [] };
        } else if (zone.ads && zone.ads.length > 0 && zoneMap[zone.zone_id].ads.length === 0) {
          zoneMap[zone.zone_id].ads = zone.ads;
        }
      }
    }

    // Contratado: match do nome do site contra veículo na planilha
    const siteLower = (site.site_name || "").toLowerCase().trim();
    const contractedFromSheet = contractedIdx[siteLower] || 0;
    const contracted = contractedFromSheet > 0
      ? contractedFromSheet
      : (limitTotal > 0 && report.sites.length > 0
        ? Math.round(limitTotal / report.sites.length)
        : imp);

    const zoneChildren: StructureItem[] = Object.entries(zoneMap).map(([idStr, zoneData]) => {
      const zoneId = Number(idStr);
      const zStats = sumZoneDays(site.days, zoneId);
      const zImp = zStats.impressions;
      const zClk = zStats.clicks;
      const zViw = zStats.views;
      // VA%: BQ viewability para display; fallback para views (VTR) quando não há dado BQ (vídeo)
      const zoneKey = String(zoneId);
      const hasBqData = zoneKey in viewIdx;
      const viewable = hasBqData ? (viewIdx[zoneKey] || 0) : zViw;
      const va = zImp > 0 ? (viewable / zImp) * 100 : 0;

      const adChildren: StructureItem[] = zoneData.ads.map((ad) => {
        const aImp = Number(ad.stats?.impressions) || 0;
        const aClk = Number(ad.stats?.clicks) || 0;
        const aViw = Number(ad.stats?.views) || 0;
        // Para vídeo (sem dado BQ na zona): VA = views/impressions
        const aViewable = hasBqData ? 0 : aViw;
        const aVA = aImp > 0 ? (aViewable / aImp) * 100 : 0;
        return {
          name: ad.ad_name || `Ad #${ad.ad_id}`,
          contracted: 0,
          delivered: aImp,
          pacing: 0,
          impressions: aImp,
          viewables: aViewable,
          va: aVA,
          clicks: aClk,
          ctr: aImp > 0 ? (aClk / aImp) * 100 : 0,
          views: aViw,
          vtr: aImp > 0 ? (aViw / aImp) * 100 : 0,
        };
      });

      return {
        name: zoneData.name,
        contracted: 0,
        delivered: zImp,
        pacing: 0,
        impressions: zImp,
        viewables: viewable,
        va,
        clicks: zClk,
        ctr: zImp > 0 ? (zClk / zImp) * 100 : 0,
        views: zViw,
        vtr: zImp > 0 ? (zViw / zImp) * 100 : 0,
        children: adChildren.length > 0 ? adChildren : undefined,
      };
    });

    const siteViewable = zoneChildren.reduce((s, c) => s + (c.viewables || 0), 0);
    const siteVA = imp > 0 ? (siteViewable / imp) * 100 : 0;

    return {
      name: site.site_name,
      purchaseType: purchaseTypeIdx[siteLower] || "CPM",
      contracted,
      delivered: imp,
      pacing: contracted > 0 ? Math.round((imp / contracted) * 100) : 0,
      impressions: imp,
      viewables: siteViewable,
      va: siteVA,
      clicks: clk,
      ctr: imp > 0 ? (clk / imp) * 100 : 0,
      views: viw,
      vtr: imp > 0 ? (viw / imp) * 100 : 0,
      children: zoneChildren.length > 0 ? zoneChildren : undefined,
    };
  });

  const dateAcc: Record<string, { delivery: number; views: number }> = {};
  for (const site of report.sites) {
    for (const day of site.days) {
      if (!day.stats) continue;
      if (!dateAcc[day.date]) dateAcc[day.date] = { delivery: 0, views: 0 };
      dateAcc[day.date].delivery += day.stats.impressions;
      dateAcc[day.date].views   += day.stats.views;
    }
  }
  const chartData: ChartPoint[] = Object.entries(dateAcc)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date: date.slice(5).replace("-", "/"),
      delivery:    v.delivery,
      viewability: v.views,
    }));

  const geoData = buildGeoData(vastRows, viewRows);

  return {
    campaign: {
      title: `Auditoria de Campanha: ${campaign.name} (ID #${campaign.id})`,
      period,
      agency,
      client: campaign.advertiser.name,
      auditStatus: { percentage: 100, verifier: "AD Desk Verifier" },
    },
    structure,
    chartData,
    geoData,
    purchaseGroups: computePurchaseGroups(structure),
  };
}

export default function Home() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const campaignId = Number(params.id);
    if (!campaignId) {
      setError("ID de campanha inválido.");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const campaigns = await fetchCampaigns();
        const campaign = campaigns.find((c) => c.id === campaignId);
        if (!campaign) {
          setError(`Campanha #${campaignId} não encontrada.`);
          return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        const dateBegin = campaign.created_at.slice(0, 10);
        const dateEnd = campaign.limits.finish_at
          ? campaign.limits.finish_at.slice(0, 10)
          : yesterdayStr;

        // Todas as fontes em paralelo — erros de BQ/Sheets são não-fatais
        const [report, sheetRows, viewRows, vastRows] = await Promise.all([
          fetchCampaignReport(campaignId, dateBegin, dateEnd),
          fetchSheetCampaignData().catch(() => [] as SheetCampaignRow[]),
          fetchCampaignViewability(campaignId, dateBegin, dateEnd).catch(() => [] as ViewabilityRow[]),
          fetchCampaignVast(campaignId, dateBegin, dateEnd).catch(() => [] as VastRow[]),
        ]);

        setData(buildDashboardData(campaign, report, sheetRows, viewRows, vastRows));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Carregando campanha...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] p-6">
        <div className="max-w-[1440px] mx-auto">
          <div className="bg-white rounded-[31px] p-8">
            <p className="text-red-500 text-sm mb-4">{error ?? "Dados não disponíveis."}</p>
            <button
              onClick={() => navigate("/")}
              className="text-[#153ece] text-sm underline"
            >
              ← Voltar para campanhas
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { campaign, structure, chartData, geoData, purchaseGroups } = data;
  const { delivered, impressions, viewables, views, clicks, viewability, ctr, vtr } =
    computeTotals(structure);

  return (
    <div className="min-h-screen bg-[#f1f1f1] p-3 sm:p-6">
      <div className="max-w-[1440px] mx-auto">
        <button
          onClick={() => navigate("/")}
          className="text-[#153ece] text-sm mb-4 hover:underline flex items-center gap-1"
        >
          ← Todas as campanhas
        </button>

        <Header campaign={campaign} structure={structure} />

        {/* Linha 1: Contratado + Entregue por tipo de compra */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Contratado — uma barra por tipo de compra */}
          <div className="bg-white rounded-[24px] p-4">
            <h3 className="text-black text-xs font-medium mb-3">Contratado</h3>
            <div className="flex flex-col gap-2">
              {purchaseGroups.map((g) => (
                <div key={g.type}>
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="bg-[#153ece] text-white text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md leading-none shrink-0">
                      {g.type}
                    </span>
                    <span className="text-black text-xl font-medium leading-none">
                      {g.contracted.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 bg-black/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#f4af00] h-full rounded-full"
                        style={{ width: `${Math.min(g.pacing, 100)}%` }}
                      />
                    </div>
                    <span className="text-[#f4af00] text-[10px] font-semibold shrink-0">{g.pacing}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Entregue — uma linha por tipo de compra */}
          <div className="bg-white rounded-[24px] p-4">
            <h3 className="text-black text-xs font-medium mb-3">Entregue</h3>
            <div className="flex flex-col gap-2">
              {purchaseGroups.map((g) => (
                <div key={g.type} className="flex items-baseline gap-2">
                  <span className="bg-[#153ece] text-white text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md leading-none shrink-0">
                    {g.type}
                  </span>
                  <span className="text-black text-xl font-medium leading-none">
                    {g.delivered.toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Linha 2: métricas individuais */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
          <MetricsCard title="Impressões" value={impressions.toLocaleString("pt-BR")} />
          <div className="bg-white rounded-[24px] p-4 flex flex-col justify-between min-h-[90px]">
            <h3 className="text-black text-xs font-medium leading-tight">Impressões Visíveis</h3>
            <div className="flex items-end justify-between gap-1">
              <div className="text-black text-xl font-medium leading-none">{viewables.toLocaleString("pt-BR")}</div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-black/40 text-[9px] font-medium uppercase tracking-wide leading-none mb-0.5">VA%</span>
                <span className="text-black/70 text-xs font-semibold">{viewability.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          <MetricsCard
            title="Visualizações"
            value={views.toLocaleString("pt-BR")}
            badge="VTR"
            badgeValue={`${vtr.toFixed(2)}%`}
          />
          <MetricsCard
            title="Cliques"
            value={clicks.toLocaleString("pt-BR")}
            badge="CTR"
            badgeValue={`${ctr.toFixed(2)}%`}
          />
        </div>

        <div className="mb-6">
          <StructureTable data={structure} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <DailyDeliveryChart
            data={chartData}
            title="Entrega Diária vs. Visualizações"
          />
          <GeographicMap
            data={geoData}
            title="Distribuição Geográfica (Top Regiões)"
          />
        </div>
      </div>
    </div>
  );
}
