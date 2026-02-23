import { Header } from "@/components/Header";
import { MetricsCard } from "@/components/MetricsCard";
import { StructureTable } from "@/components/StructureTable";
import { DailyDeliveryChart } from "@/components/DailyDeliveryChart";
import { GeographicMap } from "@/components/GeographicMap";
import dashboardData from "@/data/dashboard.json";
import { computeTotals } from "@/lib/aggregateStructure";

export default function Home() {
  const { campaign, structure, charts } = dashboardData;

  // Totais calculados a partir dos valores já agregados de cada veículo
  const { contracted, delivered, impressions, views, clicks, pacing, viewability, ctr, vtr } =
    computeTotals(structure);

  return (
    <div className="min-h-screen bg-[#f1f1f1] p-6">
      <div className="max-w-[1440px] mx-auto">
        {/* Header Section */}
        <Header campaign={campaign} />

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

          {/* Card 6: Viewability (viewables / impressões) */}
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
            data={charts.dailyDelivery.data}
            title={charts.dailyDelivery.title}
          />
          <GeographicMap
            data={charts.geographicDistribution.data}
            title={charts.geographicDistribution.title}
          />
        </div>
      </div>
    </div>
  );
}

// Note: This implementation uses a clean, component-based architecture
// that separates concerns and makes it easy to integrate with real API data.
// Simply replace the imported dashboardData with API calls in a useEffect hook.