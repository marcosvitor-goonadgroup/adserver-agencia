import { useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface ChartPoint {
  date: string;
  impressions: number;
  views: number;
  clicks: number;
  viewables: number;
  ctr: number;
  vtr: number;
  va: number;
}

interface DailyDeliveryChartProps {
  data: ChartPoint[];
  title: string;
}

type PrimaryMetric = "impressions" | "views" | "clicks" | "viewables";
type SecondaryMetric = "ctr" | "vtr" | "va" | "impressions" | "views" | "clicks" | "viewables" | "none";

const PRIMARY_OPTIONS: { value: PrimaryMetric; label: string }[] = [
  { value: "impressions", label: "Impressões" },
  { value: "views",       label: "Visualizações" },
  { value: "clicks",      label: "Cliques" },
  { value: "viewables",   label: "Imp. Viáveis" },
];

const SECONDARY_OPTIONS: { value: SecondaryMetric; label: string; isRate: boolean }[] = [
  { value: "none",        label: "Nenhuma",        isRate: false },
  { value: "ctr",         label: "CTR %",          isRate: true  },
  { value: "vtr",         label: "VTR %",          isRate: true  },
  { value: "va",          label: "VA %",           isRate: true  },
  { value: "impressions", label: "Impressões",     isRate: false },
  { value: "views",       label: "Visualizações",  isRate: false },
  { value: "clicks",      label: "Cliques",        isRate: false },
  { value: "viewables",   label: "Imp. Viáveis",  isRate: false },
];

function formatPrimary(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return String(val);
}

export function DailyDeliveryChart({ data, title }: DailyDeliveryChartProps) {
  const [primary, setPrimary] = useState<PrimaryMetric>("impressions");
  const [secondary, setSecondary] = useState<SecondaryMetric>("vtr");

  const primaryLabel = PRIMARY_OPTIONS.find((o) => o.value === primary)!.label;
  const secondaryMeta = SECONDARY_OPTIONS.find((o) => o.value === secondary)!;
  const secondaryLabel = secondaryMeta.label;
  const secondaryIsRate = secondaryMeta.isRate;

  return (
    <div className="bg-white rounded-[31px] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-black text-base font-semibold">{title}</h2>

        {/* Seletores */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Métrica primária */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#153ece] inline-block rounded-full" />
            <select
              value={primary}
              onChange={(e) => setPrimary(e.target.value as PrimaryMetric)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-black bg-white focus:outline-none focus:ring-1 focus:ring-[#153ece]"
            >
              {PRIMARY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Métrica secundária */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-[#f4af00] inline-block" />
            <select
              value={secondary}
              onChange={(e) => setSecondary(e.target.value as SecondaryMetric)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-black bg-white focus:outline-none focus:ring-1 focus:ring-[#153ece]"
            >
              {SECONDARY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 4, right: secondary !== "none" ? 48 : 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#153ece" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#153ece" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />

          {/* Eixo esquerdo — métrica primária */}
          <YAxis
            yAxisId="left"
            tickFormatter={formatPrimary}
            tick={{ fontSize: 11, fill: "#153ece" }}
            axisLine={false}
            tickLine={false}
            width={48}
          />

          {/* Eixo direito — secundária: taxa (%) ou bruta com formatação K/M */}
          {secondary !== "none" && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={secondaryIsRate ? (v) => `${v}%` : formatPrimary}
              tick={{ fontSize: 11, fill: "#f4af00" }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
          )}

          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              fontSize: "12px",
              padding: "10px 14px",
            }}
            formatter={(value: number, name: string) => {
              if (name === secondaryLabel && secondaryIsRate) return [`${value.toFixed(2)}%`, name];
              return [value.toLocaleString("pt-BR"), name];
            }}
          />

          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
          />

          {/* Área principal */}
          <Area
            yAxisId="left"
            type="monotone"
            dataKey={primary}
            name={primaryLabel}
            stroke="#153ece"
            strokeWidth={2}
            fill="url(#gradPrimary)"
            dot={false}
            activeDot={{ r: 4 }}
          />

          {/* Linha secundária */}
          {secondary !== "none" && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey={secondary}
              name={secondaryLabel}
              stroke="#f4af00"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 4 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
