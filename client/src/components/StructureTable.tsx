import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { aggregateItem, type StructureItem } from "@/lib/aggregateStructure";

interface StructureTableProps {
  data: StructureItem[];
}

function formatNumber(num: number): string {
  return num.toLocaleString("pt-BR");
}

function StructureRow({
  item,
  level = 0,
  onToggle,
  expanded,
}: {
  item: StructureItem;
  level?: number;
  onToggle: (name: string) => void;
  expanded: Record<string, boolean>;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expanded[item.name];

  // linha pai mostra valores agregados dos filhos
  const row = hasChildren ? aggregateItem(item) : item;
  const pacing = Math.min(Math.round((row.delivered / row.contracted) * 100), 100);

  return (
    <>
      <tr className="border-b border-gray-200 hover:bg-gray-50">
        <td className="px-4 py-3 text-black text-sm font-medium">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
            {hasChildren && (
              <button
                onClick={() => onToggle(item.name)}
                className="p-0 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-4" />}
            <span>{item.name}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-black text-sm">{formatNumber(row.contracted)}</td>
        <td className="px-4 py-3 text-black text-sm">{formatNumber(row.delivered)}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-1">
              <div
                className="bg-green-500 h-full rounded-full"
                style={{ width: `${pacing}%` }}
              />
            </div>
            <span className="text-black text-sm">{pacing}%</span>
          </div>
        </td>
        <td className="px-4 py-3 text-black text-sm">{formatNumber(row.impressions)}</td>
        <td className="px-4 py-3 text-black text-sm">{formatNumber(row.viewables)}</td>
        <td className="px-4 py-3 text-green-600 text-sm font-medium">{row.va.toFixed(0)}%</td>
        <td className="px-4 py-3 text-black text-sm">{formatNumber(row.clicks)}</td>
        <td className="px-4 py-3 text-black text-sm">{row.ctr.toFixed(2)}%</td>
        <td className="px-4 py-3 text-black text-sm">{formatNumber(row.views)}</td>
        <td className="px-4 py-3 text-black text-sm">{row.vtr.toFixed(2)}%</td>
      </tr>
      {hasChildren && isExpanded && (
        <>
          {item.children!.map((child) => (
            <StructureRow
              key={child.name}
              item={child}
              level={level + 1}
              onToggle={onToggle}
              expanded={expanded}
            />
          ))}
        </>
      )}
    </>
  );
}

export function StructureTable({ data }: StructureTableProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (name: string) => {
    setExpanded((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  return (
    <div className="bg-white rounded-[31px] p-6 overflow-x-auto">
      <h2 className="text-black text-base font-semibold mb-4">Veículo</h2>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="px-4 py-3 text-left text-black text-base font-semibold">Veículo</th>
            <th className="px-4 py-3 text-left text-black text-base font-semibold">Contratado</th>
            <th className="px-4 py-3 text-left text-black text-base font-semibold">Entregue</th>
            <th className="px-4 py-3 text-left text-black text-base font-semibold">Pacing</th>
            <th className="px-4 py-3 text-left text-black text-base font-semibold">Impressões</th>
            <th className="px-4 py-3 text-left text-black text-base font-semibold">Viewables</th>
            <th className="px-4 py-3 text-left text-black text-base font-semibold">VA</th>
            <th className="px-4 py-3 text-left text-black text-base font-semibold">Cliques</th>
            <th className="px-4 py-3 text-left text-black text-base font-semibold">CTR</th>
            <th className="px-4 py-3 text-left text-black text-base font-semibold">Views</th>
            <th className="px-4 py-3 text-left text-black text-base font-semibold">VTR</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <StructureRow
              key={item.name}
              item={item}
              onToggle={toggleExpand}
              expanded={expanded}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
