import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { fetchCampaigns, type Campaign } from "@/lib/api";

function statusColor(runstatus: string) {
  if (runstatus === "Running") return "bg-green-100 text-green-700";
  if (runstatus === "Finished") return "bg-gray-100 text-gray-600";
  return "bg-yellow-100 text-yellow-700";
}

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    fetchCampaigns()
      .then(setCampaigns)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#f1f1f1] p-6">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="w-full bg-[#153ece] rounded-[34px] px-10 py-7 mb-6 flex items-center gap-4">
          <img src="/1-426.svg" alt="Logo" className="h-10" />
          <div>
            <h1 className="text-white text-[28px] font-medium leading-tight">
              AD Desk
            </h1>
            <p className="text-white/70 text-base">Painel de Campanhas</p>
          </div>
        </div>

        {/* Content */}
        {loading && (
          <div className="bg-white rounded-[31px] p-12 flex items-center justify-center">
            <div className="text-gray-500 text-sm">Carregando campanhas...</div>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-[31px] p-8">
            <p className="text-red-500 text-sm">Erro ao carregar campanhas: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-[31px] p-6 overflow-x-auto">
            <h2 className="text-black text-base font-semibold mb-4">Campanhas</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="px-4 py-3 text-left text-black text-base font-semibold">ID</th>
                  <th className="px-4 py-3 text-left text-black text-base font-semibold">Nome</th>
                  <th className="px-4 py-3 text-left text-black text-base font-semibold">Anunciante</th>
                  <th className="px-4 py-3 text-left text-black text-base font-semibold">Modelo</th>
                  <th className="px-4 py-3 text-left text-black text-base font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-black text-base font-semibold">Criado em</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-500 text-sm">{c.id}</td>
                    <td className="px-4 py-3 text-black text-sm font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-black text-sm">{c.advertiser.name}</td>
                    <td className="px-4 py-3 text-black text-sm">{c.pricemodel.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColor(c.runstatus.name)}`}
                      >
                        {c.runstatus.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">
                      {c.created_at.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/dashboard/${c.id}`)}
                        className="bg-[#153ece] hover:bg-[#1233b0] text-white text-sm px-4 py-2 rounded-xl transition-colors"
                      >
                        Ver dashboard
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {campaigns.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">
                Nenhuma campanha encontrada.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
