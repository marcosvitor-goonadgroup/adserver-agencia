import { useState } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import dashboardData from "@/data/dashboard.json";
import { aggregateItem, type StructureItem } from "@/lib/aggregateStructure";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
}

type ReportType = "geral" | string; // string = nome do veículo

function itemToRow(item: StructureItem, prefix = ""): Record<string, unknown> {
  const pacing = Math.round((item.delivered / item.contracted) * 100);
  return {
    Veículo: prefix + item.name,
    Contratado: item.contracted,
    Entregue: item.delivered,
    "Pacing (%)": pacing,
    Impressões: item.impressions,
    Viewables: item.viewables,
    "VA (%)": item.va.toFixed(0),
    Cliques: item.clicks,
    "CTR (%)": item.ctr.toFixed(2),
    Views: item.views,
    "VTR (%)": item.vtr.toFixed(2),
  };
}

// Achata estrutura do veículo usando valores agregados no pai
function flattenStructure(items: StructureItem[]): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (const raw of items) {
    const item = aggregateItem(raw);
    rows.push(itemToRow(item));
    if (raw.children) {
      for (const child of raw.children) {
        rows.push(itemToRow(child, "  └ "));
      }
    }
  }
  return rows;
}

function buildRows(reportType: ReportType): Record<string, unknown>[] {
  const { structure } = dashboardData;

  if (reportType === "geral") {
    const contracted  = structure.reduce((s, v) => s + v.contracted, 0);
    const delivered   = structure.reduce((s, v) => s + v.delivered, 0);
    const impressions = structure.reduce((s, v) => s + v.impressions, 0);
    const viewables   = structure.reduce((s, v) => s + v.viewables, 0);
    const clicks      = structure.reduce((s, v) => s + v.clicks, 0);
    const views       = structure.reduce((s, v) => s + v.views, 0);

    const summary = [
      { Métrica: "Contratado Total",    Valor: contracted },
      { Métrica: "Entregue Total",      Valor: delivered },
      { Métrica: "Impressões",          Valor: impressions },
      { Métrica: "Visualizações",       Valor: views },
      { Métrica: "Cliques",             Valor: clicks },
      { Métrica: "Viewability (%)",     Valor: impressions > 0 ? ((viewables / impressions) * 100).toFixed(1) : "0.0" },
      { Métrica: "CTR (%)",             Valor: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : "0.00" },
      { Métrica: "VTR (%)",             Valor: impressions > 0 ? ((views / impressions) * 100).toFixed(2) : "0.00" },
    ];
    return [...summary, {}, ...flattenStructure(structure)] as Record<string, unknown>[];
  }

  // por veículo específico
  const vehicle = structure.find((v) => v.name === reportType);
  if (!vehicle) return [];
  return flattenStructure([vehicle]);
}

function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(";"),
    ...rows.map((r) =>
      headers.map((h) => {
        const val = r[h] ?? "";
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(";")
    ),
  ];
  const blob = new Blob(["\uFEFF" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel(rows: Record<string, unknown>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatório");
  XLSX.writeFile(wb, filename);
}

export function ReportModal({ open, onClose }: ReportModalProps) {
  const [mode, setMode] = useState<"geral" | "veiculo">("geral");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const { campaign, structure } = dashboardData;

  const vehicleNames = structure.map((v) => v.name);

  // garante que sempre haja um veículo selecionado ao trocar para o modo veículo
  function handleModeChange(next: "geral" | "veiculo") {
    setMode(next);
    if (next === "veiculo" && !selectedVehicle) {
      setSelectedVehicle(vehicleNames[0] ?? "");
    }
  }

  const reportType: ReportType = mode === "geral" ? "geral" : selectedVehicle;

  const filename = (ext: string) => {
    const slug = mode === "geral" ? "geral" : selectedVehicle.toLowerCase().replace(/\s+/g, "_");
    return `relatorio_${slug}.${ext}`;
  };

  function handleDownload(format: "csv" | "excel") {
    if (mode === "veiculo" && !selectedVehicle) return;
    const rows = buildRows(reportType);
    if (format === "csv") downloadCSV(rows, filename("csv"));
    else downloadExcel(rows, filename("xlsx"));
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-3xl p-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Baixar Relatório</DialogTitle>
        </DialogHeader>

        {/* Campanha */}
        <div className="mt-4 mb-6 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
          <p className="text-xs text-gray-400 mb-0.5">Campanha</p>
          <p className="text-sm font-medium text-gray-900">{campaign.title}</p>
        </div>

        {/* Tipo de relatório */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-3">Tipo de relatório:</p>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="reportMode"
                checked={mode === "geral"}
                onChange={() => handleModeChange("geral")}
                className="accent-[#153ece] w-4 h-4"
              />
              <span className="text-sm">Geral</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="reportMode"
                checked={mode === "veiculo"}
                onChange={() => handleModeChange("veiculo")}
                className="accent-[#153ece] w-4 h-4"
              />
              <span className="text-sm">Por veículo</span>
            </label>

            {mode === "veiculo" && (
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="ml-7 mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#153ece]/30"
              >
                {vehicleNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-2xl border-[#153ece] text-[#153ece] hover:bg-blue-50"
            onClick={() => handleDownload("csv")}
          >
            CSV
          </Button>
          <Button
            className="flex-1 rounded-2xl bg-[#153ece] hover:bg-[#1233b0] text-white"
            onClick={() => handleDownload("excel")}
          >
            Excel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
