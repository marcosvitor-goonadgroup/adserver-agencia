import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportModal } from "@/components/ReportModal";

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
}

export function Header({ campaign }: HeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="w-full bg-[#153ece] rounded-[34px] px-10 py-7 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-white text-[32px] font-medium mb-4">
              {campaign.title}
            </h1>
            <div className="flex gap-8 text-white text-xl font-normal">
              <span>Período: {campaign.period}</span>
              <span className="border-l border-white/30 pl-8">
                Agência: {campaign.agency}
              </span>
              <span className="border-l border-white/30 pl-8">
                Cliente: {campaign.client}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="bg-white text-black hover:bg-gray-100 rounded-2xl px-6 py-2 flex items-center gap-2"
            onClick={() => setModalOpen(true)}
          >
            <Download className="w-4 h-4" />
            Baixar relatório
          </Button>
        </div>

        <div className="flex items-center gap-4 bg-white/25 rounded-2xl px-6 py-4 w-fit">
          <div className="flex items-center gap-3">
            <div className="text-white text-[32px] font-normal">
              {campaign.auditStatus.percentage}%
            </div>
            <div className="text-white text-xl font-normal">
              Auditado por {campaign.auditStatus.verifier}
            </div>
          </div>
        </div>
      </div>

      <ReportModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
