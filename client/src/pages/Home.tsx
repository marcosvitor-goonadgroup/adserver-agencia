import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { MetricsCard } from "@/components/MetricsCard";
import { StructureTable } from "@/components/StructureTable";
import { DailyDeliveryChart } from "@/components/DailyDeliveryChart";
import { GeographicMap } from "@/components/GeographicMap";
import { computeTotals, type StructureItem } from "@/lib/aggregateStructure";
import { fetchCampaigns, fetchCampaignReport, type Campaign } from "@/lib/api";

interface DashboardData {
  campaign: {
    title: string;
    period: string;
    agency: string;
    client: string;
    auditStatus: { percentage: number; verifier: string };
  };
  structure: StructureItem[];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 10).split("-").reverse().join("/");
}

function buildDashboardData(campaign: Campaign, report: { sites: { site_id: number; site_name: string; impressions: number; clicks: number; views: number; viewables: number }[] }): DashboardData {
  const startAt = formatDate(campaign.limits.start_at);
  const finishAt = formatDate(campaign.limits.finish_at);
  const period = startAt && finishAt ? `${startAt} - ${finishAt}` : "—";

  const limitTotal = campaign.limits.additional?.limit_total ?? 0;

  const structure: StructureItem[] = report.sites.map((site) => {
    const impressions = Number(site.impressions) || 0;
    const viewables = Number(site.viewables) || 0;
    const clicks = Number(site.clicks) || 0;
    const views = Number(site.views) || 0;

    const va  = impressions > 0 ? (viewables / impressions) * 100 : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const vtr = impressions > 0 ? (views / impressions) * 100 : 0;

    // Distribute contracted proportionally among sites (if we have a total limit)
    const contracted = limitTotal > 0 && report.sites.length > 0
      ? Math.round(limitTotal / report.sites.length)
      : impressions;

    return {
      name: site.site_name,
      contracted,
      delivered: impressions,
      pacing: contracted > 0 ? Math.round((impressions / contracted) * 100) : 0,
      impressions,
      viewables,
      va,
      clicks,
      ctr,
      views,
      vtr,
    };
  });

  return {
    campaign: {
      title: `Auditoria de Campanha: ${campaign.name} (ID #${campaign.id})`,
      period,
      agency: campaign.advertiser.name,
      client: campaign.advertiser.name,
      auditStatus: { percentage: 100, verifier: "AD Desk Verifier" },
    },
    structure,
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

  const { campaign, structure } = data;
  const { contracted, delivered, impressions, views, clicks, pacing, viewability, ctr, vtr } =
    computeTotals(structure);

  // Build placeholder chart data from structure totals
  const chartData = structure.slice(0, 7).map((s, i) => ({
    date: `Site ${i + 1}`,
    delivery: s.impressions,
    viewability: s.viewables,
  }));

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
          <MetricsCard
            title="Entregue"
            value={delivered.toLocaleString("pt-BR")}
          />

          {/* Card 3: Impressões */}
          <MetricsCard
            title="Impressões"
            value={impressions.toLocaleString("pt-BR")}
          />

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
          <MetricsCard
            title="Viewability (VA%)"
            value={`${viewability.toFixed(1)}%`}
          />
        </div>

        {/* Structure Table */}
        <div className="mb-6">
          <StructureTable data={structure} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-2 gap-6 mt-8">
          <DailyDeliveryChart
            data={chartData}
            title="Entrega por Site vs. Viewability"
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
