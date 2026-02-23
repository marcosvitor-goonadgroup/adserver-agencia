import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DailyDeliveryData {
  date: string;
  delivery: number;
  viewability: number;
}

interface DailyDeliveryChartProps {
  data: DailyDeliveryData[];
  title: string;
}

export function DailyDeliveryChart({ data, title }: DailyDeliveryChartProps) {
  return (
    <div className="bg-white rounded-[31px] p-6">
      <h2 className="text-black text-base font-semibold mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorDelivery" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorViewability" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1e40af" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#1e40af" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Area
            type="monotone"
            dataKey="delivery"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorDelivery)"
            name="Entrega"
          />
          <Area
            type="monotone"
            dataKey="viewability"
            stroke="#1e40af"
            fillOpacity={1}
            fill="url(#colorViewability)"
            name="Viewability"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
