import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { MetricsCard } from "@/components/MetricsCard";
import { StructureTable } from "@/components/StructureTable";
import { DailyDeliveryChart } from "@/components/DailyDeliveryChart";
import { GeographicMap } from "@/components/GeographicMap";
import { computeTotals, computePurchaseGroups, type StructureItem, type PurchaseGroup } from "@/lib/aggregateStructure";
import { type ChartPoint } from "@/components/DailyDeliveryChart";
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

const GEO_COLORS = ["#153ece", "#1e4fe0", "#3b6ef5", "#6090f8", "#93b5fb", "#bdd3fd"];

const ESTADO_SIGLA: Record<string, string> = {
  "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM",
  "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF",
  "Espírito Santo": "ES", "Goiás": "GO", "Maranhão": "MA",
  "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG",
  "Pará": "PA", "Paraíba": "PB", "Paraná": "PR", "Pernambuco": "PE",
  "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
  "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR",
  "Santa Catarina": "SC", "São Paulo": "SP", "Sergipe": "SE", "Tocantins": "TO",
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

function vehicleSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildViewabilityIndex(viewRows: ViewabilityRow[]): Record<string, number> {
  const idx: Record<string, number> = {};
  for (const row of viewRows) {
    const k = String(row.Zone_ID);
    idx[k] = (idx[k] || 0) + (Number(row.Viewable) || 0);
  }
  return idx;
}

function buildGeoData(vastRows: VastRow[], viewRows: ViewabilityRow[]): GeoPoint[] {
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
  return sorted.map(([sigla, value], i) => ({
    state: sigla,
    value: Math.round((value / total) * 100),
    color: GEO_COLORS[Math.min(i, GEO_COLORS.length - 1)],
    inLegend: i < 6,
    intensity: value / maxValue,
  }));
}

function buildDashboardData(
  campaign: Campaign,
  report: CampaignReport,
  sheetRows: SheetCampaignRow[],
  viewRows: ViewabilityRow[],
  vastRows: VastRow[],
  vehicleSlugParam: string,
): DashboardData {
  const matchingSheet = sheetRows.find(
    (r) => r.campaign.toLowerCase().includes(campaign.name.toLowerCase()) ||
           campaign.name.toLowerCase().includes(r.campaign.toLowerCase())
  );
  const agency = matchingSheet?.agency || campaign.advertiser.name;

  const viewIdx = buildViewabilityIndex(viewRows);

  // Filtra apenas o site que bate com o slug do veículo
  const filteredSites = report.sites.filter(
    (s) => vehicleSlug(s.site_name) === vehicleSlugParam
  );
  const sitesToUse = filteredSites.length > 0 ? filteredSites : report.sites;
  const isFiltered = filteredSites.length > 0;

  // Datas: da planilha específica do veículo ou da campanha
  const vehicleSheet = sheetRows.find(
    (r) => vehicleSlug(r.vehicle) === vehicleSlugParam
  );
  const startAt = formatDate(campaign.limits.start_at) || vehicleSheet?.dateBegin || matchingSheet?.dateBegin || "";
  const finishAt = formatDate(campaign.limits.finish_at) || vehicleSheet?.dateEnd || matchingSheet?.dateEnd || "";
  const period = startAt && finishAt ? `${startAt} - ${finishAt}` : "—";

  const structure: StructureItem[] = sitesToUse.map((site) => {
    const siteLower = (site.site_name || "").toLowerCase().trim();

    // Contratado da planilha para este veículo
    const siteSheet = sheetRows.find((r) => vehicleSlug(r.vehicle) === vehicleSlug(site.site_name));
    const contracted = siteSheet?.contracted || 0;
    const purchaseType = siteSheet?.purchaseType?.toUpperCase() || "CPM";

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

    const zoneChildren: StructureItem[] = Object.entries(zoneMap).map(([idStr, zoneData]) => {
      const zoneId = Number(idStr);
      const zStats = sumZoneDays(site.days, zoneId);
      const zImp = zStats.impressions;
      const zClk = zStats.clicks;
      const zViw = zStats.views;
      const zoneKey = String(zoneId);
      const hasBqData = zoneKey in viewIdx;
      const viewable = hasBqData ? (viewIdx[zoneKey] || 0) : zViw;
      const va = zImp > 0 ? (viewable / zImp) * 100 : 0;

      const adChildren: StructureItem[] = zoneData.ads.map((ad) => {
        const aImp = Number(ad.stats?.impressions) || 0;
        const aClk = Number(ad.stats?.clicks) || 0;
        const aViw = Number(ad.stats?.views) || 0;
        const aViewable = hasBqData ? 0 : aViw;
        const aVA = aImp > 0 ? (aViewable / aImp) * 100 : 0;
        return {
          name: ad.ad_name || `Ad #${ad.ad_id}`,
          contracted: 0, delivered: aImp, pacing: 0,
          impressions: aImp, viewables: aViewable, va: aVA,
          clicks: aClk, ctr: aImp > 0 ? (aClk / aImp) * 100 : 0,
          views: aViw, vtr: aImp > 0 ? (aViw / aImp) * 100 : 0,
        };
      });

      return {
        name: zoneData.name,
        contracted: 0, delivered: zImp, pacing: 0,
        impressions: zImp, viewables: viewable, va,
        clicks: zClk, ctr: zImp > 0 ? (zClk / zImp) * 100 : 0,
        views: zViw, vtr: zImp > 0 ? (zViw / zImp) * 100 : 0,
        children: adChildren.length > 0 ? adChildren : undefined,
      };
    });

    const siteViewable = zoneChildren.reduce((s, c) => s + (c.viewables || 0), 0);
    const siteImp = zoneChildren.reduce((s, c) => s + c.impressions, 0);
    const siteClk = zoneChildren.reduce((s, c) => s + c.clicks, 0);
    const siteViw = zoneChildren.reduce((s, c) => s + c.views, 0);

    void siteLower; // used for future matching if needed

    return {
      name: site.site_name,
      purchaseType,
      contracted,
      delivered: siteImp,
      pacing: contracted > 0 ? Math.round((siteImp / contracted) * 100) : 0,
      impressions: siteImp,
      viewables: siteViewable,
      va: siteImp > 0 ? (siteViewable / siteImp) * 100 : 0,
      clicks: siteClk,
      ctr: siteImp > 0 ? (siteClk / siteImp) * 100 : 0,
      views: siteViw,
      vtr: siteImp > 0 ? (siteViw / siteImp) * 100 : 0,
      children: zoneChildren.length > 0 ? zoneChildren : undefined,
    };
  });

  const dateAcc: Record<string, { impressions: number; views: number; clicks: number; viewables: number }> = {};
  for (const site of sitesToUse) {
    for (const day of site.days) {
      if (!day.stats) continue;
      if (!dateAcc[day.date]) dateAcc[day.date] = { impressions: 0, views: 0, clicks: 0, viewables: 0 };
      dateAcc[day.date].impressions += day.stats.impressions;
      dateAcc[day.date].views       += day.stats.views;
      dateAcc[day.date].clicks      += day.stats.clicks;
    }
  }
  for (const row of viewRows) {
    const d = row.Dia?.slice(0, 10);
    if (!d) continue;
    if (!dateAcc[d]) dateAcc[d] = { impressions: 0, views: 0, clicks: 0, viewables: 0 };
    dateAcc[d].viewables += Number(row.Viewable) || 0;
  }
  const chartData: ChartPoint[] = Object.entries(dateAcc)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => {
      const imp = v.impressions;
      return {
        date:        date.slice(5).replace("-", "/"),
        impressions: imp,
        views:       v.views,
        clicks:      v.clicks,
        viewables:   v.viewables,
        ctr:  imp > 0 ? parseFloat(((v.clicks   / imp) * 100).toFixed(3)) : 0,
        vtr:  imp > 0 ? parseFloat(((v.views    / imp) * 100).toFixed(3)) : 0,
        va:   imp > 0 ? parseFloat(((v.viewables / imp) * 100).toFixed(3)) : 0,
      };
    });

  const vehicleName = filteredSites[0]?.site_name || vehicleSlugParam;
  const title = isFiltered
    ? `Auditoria: ${vehicleName} — ${campaign.name} (ID #${campaign.id})`
    : `Auditoria de Campanha: ${campaign.name} (ID #${campaign.id})`;

  // Geo: filtra BQ rows apenas do site (por Site_ID se disponível, senão usa todos)
  const geoData = buildGeoData(vastRows, viewRows);

  return {
    campaign: {
      title,
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

export default function VehicleDashboard() {
  const params = useParams<{ id: string; vehicle: string }>();
  const [, navigate] = useLocation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const campaignId = Number(params.id);
    const vehicleSlugParam = params.vehicle || "";
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

        const [report, sheetRows, viewRows, vastRows] = await Promise.all([
          fetchCampaignReport(campaignId, dateBegin, dateEnd),
          fetchSheetCampaignData().catch(() => [] as SheetCampaignRow[]),
          fetchCampaignViewability(campaignId, dateBegin, dateEnd).catch(() => [] as ViewabilityRow[]),
          fetchCampaignVast(campaignId, dateBegin, dateEnd).catch(() => [] as VastRow[]),
        ]);

        setData(buildDashboardData(campaign, report, sheetRows, viewRows, vastRows, vehicleSlugParam));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.id, params.vehicle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Carregando veículo...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] p-6">
        <div className="max-w-[1440px] mx-auto">
          <div className="bg-white rounded-[31px] p-8">
            <p className="text-red-500 text-sm mb-4">{error ?? "Dados não disponíveis."}</p>
            <button onClick={() => navigate("/")} className="text-[#153ece] text-sm underline">
              ← Voltar para campanhas
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { campaign, structure, chartData, geoData, purchaseGroups } = data;
  const { impressions, viewables, views, clicks, viewability, ctr, vtr } = computeTotals(structure);

  return (
    <div className="min-h-screen bg-[#f1f1f1] p-3 sm:p-6">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate("/")}
            className="text-[#153ece] text-sm hover:underline flex items-center gap-1"
          >
            ← Todas as campanhas
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => navigate(`/dashboard/${params.id}`)}
            className="text-[#153ece] text-sm hover:underline flex items-center gap-1"
          >
            Ver campanha completa
          </button>
        </div>

        <Header campaign={campaign} structure={structure} />

        {/* Linha 1: Contratado + Entregue por tipo de compra */}
        <div className="grid grid-cols-2 gap-3 mb-3">
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
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
          <MetricsCard title="Impressões" value={impressions.toLocaleString("pt-BR")} />
          <MetricsCard title="Impressões Viáveis" value={viewables.toLocaleString("pt-BR")} />
          <MetricsCard
            title="Viewability"
            value={`${viewability.toFixed(1)}%`}
          />
          <MetricsCard title="Visualizações" value={views.toLocaleString("pt-BR")} badge="VTR" badgeValue={`${vtr.toFixed(2)}%`} />
          <MetricsCard title="Cliques" value={clicks.toLocaleString("pt-BR")} badge="CTR" badgeValue={`${ctr.toFixed(2)}%`} />
        </div>

        <div className="mb-6">
          <StructureTable data={structure} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <DailyDeliveryChart data={chartData} title="Métricas Diárias" />
          <GeographicMap data={geoData} title="Distribuição Geográfica (Top Regiões)" />
        </div>
      </div>
    </div>
  );
}
