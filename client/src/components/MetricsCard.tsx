interface MetricsCardProps {
  title: string;
  value: string | number;
  badge?: string; // label da métrica secundária ex: "CTR" ou "VTR"
  badgeValue?: string; // valor calculado ex: "0.20%"
}

export function MetricsCard({ title, value, badge, badgeValue }: MetricsCardProps) {
  return (
    <div className="bg-white rounded-[24px] p-4 flex flex-col justify-between min-h-[90px]">
      <h3 className="text-black text-xs font-medium leading-tight">{title}</h3>
      <div className="flex items-end justify-between gap-1">
        <div className="text-black text-xl font-medium leading-none">{value}</div>
        {badge && badgeValue && (
          <div className="flex flex-col items-end shrink-0">
            <span className="text-black/40 text-[9px] font-medium uppercase tracking-wide leading-none mb-0.5">
              {badge}
            </span>
            <span className="text-black/70 text-xs font-semibold">{badgeValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}
