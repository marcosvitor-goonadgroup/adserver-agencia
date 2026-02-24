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
  type Campaign,
  type CampaignReport,
  type ReportDay,
} from "@/lib/api";

interface ChartPoint {
  date: string;
  delivery: number;
  viewability: number;
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
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 10).split("-").reverse().join("/");
}

// Soma stats de todos os dias de um site
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

// Soma stats de uma zona específica ao longo de todos os dias
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

function buildDashboardData(campaign: Campaign, report: CampaignReport): DashboardData {
  const startAt = formatDate(campaign.limits.start_at);
  const finishAt = formatDate(campaign.limits.finish_at);
  const period = startAt && finishAt ? `${startAt} - ${finishAt}` : "—";

  const limitTotal = campaign.limits.additional?.limit_total ?? 0;

  const structure: StructureItem[] = report.sites.map((site) => {
    const siteStats = sumDays(site.days);
    const imp = siteStats.impressions;
    const clk = siteStats.clicks;
    const viw = siteStats.views;

    // Coleta zonas únicas do site (usando Object para evitar Map iterator)
    const zoneMap: Record<number, string> = {};
    for (const day of site.days) {
      for (const zone of day.zones) {
        if (zone.zone_id && zone.zone_name) {
          zoneMap[zone.zone_id] = zone.zone_name;
        }
      }
    }

    // Cada zona vira um filho do site
    const children: StructureItem[] = Object.entries(zoneMap).map(([idStr, zoneName]) => {
      const zoneId = Number(idStr);
      const zStats = sumZoneDays(site.days, zoneId);
      const zImp = zStats.impressions;
      const zClk = zStats.clicks;
      const zViw = zStats.views;
      return {
        name: zoneName,
        contracted: 0,
        delivered: zImp,
        pacing: 0,
        impressions: zImp,
        viewables: 0,
        va: 0,
        clicks: zClk,
        ctr: zImp > 0 ? (zClk / zImp) * 100 : 0,
        views: zViw,
        vtr: zImp > 0 ? (zViw / zImp) * 100 : 0,
      };
    });

    const contracted = limitTotal > 0 && report.sites.length > 0
      ? Math.round(limitTotal / report.sites.length)
      : imp;

    return {
      name: site.site_name,
      contracted,
      delivered: imp,
      pacing: contracted > 0 ? Math.round((imp / contracted) * 100) : 0,
      impressions: imp,
      viewables: 0,
      va: 0,
      clicks: clk,
      ctr: imp > 0 ? (clk / imp) * 100 : 0,
      views: viw,
      vtr: imp > 0 ? (viw / imp) * 100 : 0,
      children: children.length > 0 ? children : undefined,
    };
  });

  // Gera dados do gráfico diário somando todos os sites por data
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

  return {
    campaign: {
      title: `Auditoria de Campanha: ${campaign.name} (ID #${campaign.id})`,
      period,
      agency: campaign.advertiser.name,
      client: campaign.advertiser.name,
      auditStatus: { percentage: 100, verifier: "AD Desk Verifier" },
    },
    structure,
    chartData,
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

        // dateBegin = data de criação da campanha
        // dateEnd   = finish_at (se existir) ou ontem (campanha ainda rodando)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        const dateBegin = campaign.created_at.slice(0, 10);
        const dateEnd = campaign.limits.finish_at
          ? campaign.limits.finish_at.slice(0, 10)
          : yesterdayStr;

        const report = await fetchCampaignReport(campaignId, dateBegin, dateEnd);

        setData(buildDashboardData(campaign, report));
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

  const { campaign, structure, chartData } = data;
  const { contracted, delivered, impressions, views, clicks, pacing, viewability, ctr, vtr } =
    computeTotals(structure);

  const geoData = [
    { state: "SP", value: 35, color: "#1e40af" },
    { state: "RJ", value: 25, color: "#3b82f6" },
    { state: "DF", value: 18, color: "#60a5fa" },
    { state: "MG", value: 15, color: "#93c5fd" },
    { state: "PE", value: 7, color: "#dbeafe" },
  ];

  return (
    <div className="min-h-screen bg-[#f1f1f1] p-6">
      <div className="max-w-[1440px] mx-auto">
        {/* Back link */}
        <button
          onClick={() => navigate("/")}
          className="text-[#153ece] text-sm mb-4 hover:underline flex items-center gap-1"
        >
          ← Todas as campanhas
        </button>

        {/* Header Section */}
        <Header campaign={campaign} structure={structure} />

        {/* Metrics Grid */}
        <div className="grid grid-cols-6 gap-6 mb-6">
          {/* Card 1: Contratado com pacing */}
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
                    style={{ width: `${pacing}%` }}
                  />
                </div>
                <span className="text-[#f4af00] text-xs font-semibold shrink-0">{pacing}%</span>
              </div>
            </div>
          </div>

          {/* Card 2: Entregue */}
          <MetricsCard title="Entregue" value={delivered.toLocaleString("pt-BR")} />

          {/* Card 3: Impressões */}
          <MetricsCard title="Impressões" value={impressions.toLocaleString("pt-BR")} />

          {/* Card 4: Visualizações + VTR */}
          <MetricsCard
            title="Visualizações"
            value={views.toLocaleString("pt-BR")}
            badge="VTR"
            badgeValue={`${vtr.toFixed(2)}%`}
          />

          {/* Card 5: Cliques + CTR */}
          <MetricsCard
            title="Cliques"
            value={clicks.toLocaleString("pt-BR")}
            badge="CTR"
            badgeValue={`${ctr.toFixed(2)}%`}
          />

          {/* Card 6: Viewability */}
          <MetricsCard title="Viewability (VA%)" value={`${viewability.toFixed(1)}%`} />
        </div>

        {/* Structure Table */}
        <div className="mb-6">
          <StructureTable data={structure} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-2 gap-6 mt-8">
          <DailyDeliveryChart
            data={chartData}
            title="Entrega Diária vs. Visualizações"
          />
          <GeographicMap
            data={geoData}
            title="Distribuição Geográfica (Top 5 Estados)"
          />
        </div>
      </div>
    </div>
  );
}
