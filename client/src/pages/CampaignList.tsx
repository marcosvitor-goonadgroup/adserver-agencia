import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { fetchSheetCampaignData, type SheetCampaignRow } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/UserMenu";

interface CampaignGroup {
  agency: string;
  campaign: string;
  vehicles: SheetCampaignRow[];
}

function groupByCampaign(rows: SheetCampaignRow[]): CampaignGroup[] {
  const map: Record<string, CampaignGroup> = {};
  for (const row of rows) {
    const key = row.campaign;
    if (!map[key]) map[key] = { agency: row.agency, campaign: row.campaign, vehicles: [] };
    map[key].vehicles.push(row);
  }
  return Object.values(map);
}

// Normaliza o nome do veículo para usar na URL (slug)
function vehicleSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Encontra o ID da campanha no adserver pelo nome (match parcial)
// Usuário clica em "Ver campanha" → vai para /dashboard/:id
// Como não temos o ID na planilha, vamos apenas exibir e navegar para busca pelo nome
// O usuário digita o ID se quiser, ou a rota de veículo usa o nome

export default function CampaignList() {
  const [groups, setGroups] = useState<CampaignGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [campaignIdMap, setCampaignIdMap] = useState<Record<string, number>>({});
  const [, navigate] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        const [sheetRows, campaignsRes] = await Promise.all([
          fetchSheetCampaignData(),
          fetch("https://adserver-api.vercel.app/campaigns").then((r) => r.json()).catch(() => []),
        ]);

        const empresaNome = user?.empresa?.nome_fantasia?.toLowerCase() ?? null;
        // Sem empresa identificada → nenhuma campanha exibida (evita vazamento de dados de outras empresas)
        const filteredRows = empresaNome
          ? sheetRows.filter((r) => r.agency.toLowerCase() === empresaNome)
          : [];

        setGroups(groupByCampaign(filteredRows));

        // Monta mapa nome_campanha → id do adserver
        const idMap: Record<string, number> = {};
        if (Array.isArray(campaignsRes)) {
          for (const c of campaignsRes) {
            idMap[c.name.toLowerCase()] = c.id;
          }
        }
        setCampaignIdMap(idMap);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function findCampaignId(campaignName: string): number | null {
    const nameLower = campaignName.toLowerCase();
    for (const [key, id] of Object.entries(campaignIdMap)) {
      if (key.includes(nameLower) || nameLower.includes(key)) return id;
    }
    return null;
  }

  function toggleExpand(campaign: string) {
    setExpanded((prev) => ({ ...prev, [campaign]: !prev[campaign] }));
  }

  return (
    <div className="min-h-screen bg-[#f1f1f1] p-4 sm:p-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="w-full bg-[#153ece] rounded-[34px] px-8 py-6 mb-6 flex items-center gap-4">
          <img src="/1-426.svg" alt="Logo" className="h-10 brightness-0 invert" />
          <div className="flex-1">
            <h1 className="text-white text-2xl font-medium leading-tight">AD Desk</h1>
            <p className="text-white/70 text-sm">Painel de Campanhas</p>
          </div>
          <UserMenu />
        </div>

        {loading && (
          <div className="bg-white rounded-[31px] p-12 flex items-center justify-center">
            <p className="text-gray-500 text-sm">Carregando campanhas...</p>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-[31px] p-8">
            <p className="text-red-500 text-sm">Erro: {error}</p>
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="bg-white rounded-[31px] p-8">
            <p className="text-gray-400 text-sm text-center">Nenhuma campanha encontrada na planilha.</p>
          </div>
        )}

        {!loading && !error && groups.length > 0 && (
          <div className="flex flex-col gap-4">
            {groups.map((group) => {
              const campaignId = findCampaignId(group.campaign);
              const isExpanded = expanded[group.campaign];
              const totalContracted = group.vehicles.reduce((s, v) => s + v.contracted, 0);

              return (
                <div key={group.campaign} className="bg-white rounded-[24px] overflow-hidden">
                  {/* Cabeçalho da campanha */}
                  <div
                    className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(group.campaign)}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <button
                        className="p-1 rounded-lg hover:bg-gray-100 shrink-0"
                        onClick={(e) => { e.stopPropagation(); toggleExpand(group.campaign); }}
                      >
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div className="min-w-0">
                        <p className="text-black font-semibold text-base leading-tight truncate">{group.campaign}</p>
                        <p className="text-black/50 text-xs mt-0.5">{group.agency} · {group.vehicles.length} veículo{group.vehicles.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-black/40 text-[10px] uppercase tracking-wide">Contratado total</p>
                        <p className="text-black font-semibold text-sm">{totalContracted.toLocaleString("pt-BR")}</p>
                      </div>
                      {campaignId && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/${campaignId}`); }}
                          className="bg-[#153ece] hover:bg-[#1233b0] text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
                        >
                          Ver campanha
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lista de veículos */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {group.vehicles.map((v, i) => {
                        const slug = vehicleSlug(v.vehicle);
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between px-6 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-1 h-8 bg-[#153ece]/20 rounded-full shrink-0" />
                              <div className="min-w-0">
                                <p className="text-black text-sm font-medium truncate">{v.vehicle}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="bg-[#153ece] text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded leading-none">
                                    {v.purchaseType || "CPM"}
                                  </span>
                                  <span className="text-black/40 text-xs">
                                    {v.contracted.toLocaleString("pt-BR")} contratado
                                  </span>
                                  {v.dateBegin && v.dateEnd && (
                                    <span className="text-black/30 text-xs hidden sm:inline">
                                      · {v.dateBegin} — {v.dateEnd}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {campaignId && (
                              <button
                                onClick={() => navigate(`/dashboard/${campaignId}/${slug}`)}
                                className="bg-gray-100 hover:bg-gray-200 text-black/70 hover:text-black text-xs font-medium px-3 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0 ml-3"
                              >
                                Ver veículo
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
