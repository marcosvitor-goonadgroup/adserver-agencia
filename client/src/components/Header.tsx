import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportModal } from "@/components/ReportModal";
import { type StructureItem } from "@/lib/aggregateStructure";
import { UserMenu } from "@/components/UserMenu";

interface HeaderProps {
  campaign: {
    title: string;
    period: string;
    agency: string;
    client: string;
    auditStatus: {
      percentage: number;
      verifier: string;
    };
  };
  structure: StructureItem[];
}

export function Header({ campaign, structure }: HeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="w-full bg-[#153ece] rounded-[34px] px-6 py-6 mb-6 relative overflow-hidden">
        {/* Logo watermark canto inferior direito */}
        <img
          src="/1-426.svg"
          alt=""
          aria-hidden="true"
          className="absolute bottom-4 right-6 h-12 opacity-60 pointer-events-none select-none brightness-0 invert"
        />
        {/* Título + botões */}
        <div className="flex justify-between items-start gap-3 mb-4">
          <h1 className="text-white font-medium leading-tight" style={{ fontSize: "clamp(18px, 4vw, 32px)" }}>
            {campaign.title}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              className="bg-white text-black hover:bg-gray-100 rounded-2xl px-3 py-2 flex items-center gap-1.5 text-sm"
              onClick={() => setModalOpen(true)}
            >
              <Download className="w-4 h-4" />
              <span>Baixar</span>
            </Button>
            <UserMenu />
          </div>
        </div>

        {/* Metadados em grid 2 colunas no mobile, linha no desktop */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 md:flex md:gap-8 text-white text-sm md:text-xl font-normal">
          <div>
            <div className="text-white/60 text-xs uppercase tracking-wide">Período</div>
            <div>{campaign.period || "—"}</div>
          </div>
          <div>
            <div className="text-white/60 text-xs uppercase tracking-wide">Agência</div>
            <div>{campaign.agency}</div>
          </div>
          <div>
            <div className="text-white/60 text-xs uppercase tracking-wide">Cliente</div>
            <div>{campaign.client}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/25 rounded-2xl px-5 py-3 w-fit">
          <div className="text-white font-normal" style={{ fontSize: "clamp(20px, 5vw, 32px)" }}>
            {campaign.auditStatus.percentage}%
          </div>
          <div className="text-white text-sm md:text-xl font-normal">
            Auditado por {campaign.auditStatus.verifier}
          </div>
        </div>
      </div>

      <ReportModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        campaign={campaign}
        structure={structure}
      />
    </>
  );
}
