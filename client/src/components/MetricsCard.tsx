interface MetricsCardProps {
  title: string;
  value: string | number;
  badge?: string; // label da métrica secundária ex: "CTR" ou "VTR"
  badgeValue?: string; // valor calculado ex: "0.20%"
}

export function MetricsCard({ title, value, badge, badgeValue }: MetricsCardProps) {
  return (
    <div className="bg-white rounded-[34px] p-6 flex flex-col justify-between h-[106px]">
      <h3 className="text-black text-[15px] font-medium">{title}</h3>
      <div className="flex items-end justify-between">
        <div className="text-black text-3xl font-medium">{value}</div>
        {badge && badgeValue && (
          <div className="flex flex-col items-end">
            <span className="text-black/40 text-[10px] font-medium uppercase tracking-wide leading-none mb-0.5">
              {badge}
            </span>
            <span className="text-black/70 text-sm font-semibold">{badgeValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}
