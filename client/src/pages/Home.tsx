import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { MetricsCard } from "@/components/MetricsCard";
import { StructureTable } from "@/components/StructureTable";
import { DailyDeliveryChart } from "@/components/DailyDeliveryChart";
import { GeographicMap } from "@/components/GeographicMap";
import { computeTotals, type StructureItem } from "@/lib/aggregateStructure";
import {
  fetchCampaigns,
  fetchCampaignReport,
  fetchCampaignViewability,
  fetchCampaignVast,
  fetchSheetCampaignData,
  type Campaign,
  type CampaignReport,
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

function buildGeoData(vastRows: VastRow[]): GeoPoint[] {
  const regionMap: Record<string, number> = {};
  for (const row of vastRows) {
    const r = row.region || row.country || "Desconhecido";
    regionMap[r] = (regionMap[r] || 0) + (Number(row.Impression) || 0);
  }
  const total = Object.values(regionMap).reduce((s, v) => s + v, 0) || 1;
  const sorted = Object.entries(regionMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);
  return sorted.map(([region, value], i) => ({
    state: region.length > 2 ? region.slice(0, 2).toUpperCase() : region.toUpperCase(),
    value: Math.round((value / total) * 100),
    color: GEO_COLORS[i] || "#93b5fb",
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

function buildDashboardData(
  campaign: Campaign,
  report: CampaignReport,
  sheetRows: SheetCampaignRow[],
  viewRows: ViewabilityRow[],
  vastRows: VastRow[],
): DashboardData {
  const startAt = formatDate(campaign.limits.start_at);
  const finishAt = formatDate(campaign.limits.finish_at);
  const period = startAt && finishAt ? `${startAt} - ${finishAt}` : "—";

  // Agência: da planilha (match por nome de campanha) ou fallback para advertiser
  const matchingSheet = sheetRows.find(
    (r) => r.campaign.toLowerCase().includes(campaign.name.toLowerCase()) ||
           campaign.name.toLowerCase().includes(r.campaign.toLowerCase())
  );
  const agency = matchingSheet?.agency || campaign.advertiser.name;

  const contractedIdx = buildContractedIndex(sheetRows);
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

    const zoneMap: Record<number, string> = {};
    for (const day of site.days) {
      for (const zone of day.zones) {
        if (zone.zone_id && zone.zone_name) {
          zoneMap[zone.zone_id] = zone.zone_name;
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

    const children: StructureItem[] = Object.entries(zoneMap).map(([idStr, zoneName]) => {
      const zoneId = Number(idStr);
      const zStats = sumZoneDays(site.days, zoneId);
      const zImp = zStats.impressions;
      const zClk = zStats.clicks;
      const zViw = zStats.views;
      const viewable = viewIdx[String(zoneId)] || 0;
      const va = zImp > 0 ? (viewable / zImp) * 100 : 0;
      return {
        name: zoneName,
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
      };
    });

    const siteViewable = children.reduce((s, c) => s + (c.viewables || 0), 0);
    const siteVA = imp > 0 ? (siteViewable / imp) * 100 : 0;

    return {
      name: site.site_name,
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
      children: children.length > 0 ? children : undefined,
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

  const geoData = buildGeoData(vastRows);

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

  const { campaign, structure, chartData, geoData } = data;
  const { contracted, delivered, impressions, views, clicks, pacing, viewability, ctr, vtr } =
    computeTotals(structure);

  return (
    <div className="min-h-screen bg-[#f1f1f1] p-6">
      <div className="max-w-[1440px] mx-auto">
        <button
          onClick={() => navigate("/")}
          className="text-[#153ece] text-sm mb-4 hover:underline flex items-center gap-1"
        >
          ← Todas as campanhas
        </button>

        <Header campaign={campaign} structure={structure} />

        <div className="grid grid-cols-6 gap-6 mb-6">
          {/* Contratado com pacing */}
          <div className="bg-white rounded-[34px] p-6 h-[106px] flex flex-col justify-between">
            <h3 className="text-black text-[15px] font-medium">Contratado</h3>
            <div>
              <div className="text-black text-3xl font-medium mb-2">
                {contracted.toLocaleString("pt-BR")}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-black/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#f4af00] h-full rounded-full"
                    style={{ width: `${Math.min(pacing, 100)}%` }}
                  />
                </div>
                <span className="text-[#f4af00] text-xs font-semibold shrink-0">{pacing}%</span>
              </div>
            </div>
          </div>

          <MetricsCard title="Entregue" value={delivered.toLocaleString("pt-BR")} />
          <MetricsCard title="Impressões" value={impressions.toLocaleString("pt-BR")} />
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
          <MetricsCard title="Viewability (VA%)" value={`${viewability.toFixed(1)}%`} />
        </div>

        <div className="mb-6">
          <StructureTable data={structure} />
        </div>

        <div className="grid grid-cols-2 gap-6 mt-8">
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
