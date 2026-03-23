import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, LogOut, User } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const firstName = user?.name ?? "";
  const lastName = user?.last_name ?? "";
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#f1f1f1] p-4 sm:p-6">
      <div className="max-w-[600px] mx-auto">
        {/* Header */}
        <div className="w-full bg-[#153ece] rounded-[34px] px-8 py-6 mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-2xl bg-white/20 hover:bg-white/30 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-white text-2xl font-medium leading-tight">Meu Perfil</h1>
            <p className="text-white/70 text-sm">Informações da sua conta</p>
          </div>
          <img src="/1-426.svg" alt="" aria-hidden className="h-9 brightness-0 invert opacity-60 pointer-events-none" />
        </div>

        {/* Card avatar + nome */}
        <div className="bg-white rounded-[24px] px-8 py-8 mb-4 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-[#153ece] flex items-center justify-center shrink-0">
            {user?.filePath ? (
              <img
                src={(user as { filePath?: string }).filePath}
                alt={fullName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : initials ? (
              <span className="text-white text-3xl font-bold">{initials}</span>
            ) : (
              <User className="w-10 h-10 text-white" />
            )}
          </div>
          <div className="text-center">
            <p className="text-black text-xl font-semibold leading-tight">{fullName || "—"}</p>
            <p className="text-black/50 text-sm mt-0.5">{user?.email ?? "—"}</p>
          </div>
        </div>

        {/* Informações */}
        <div className="bg-white rounded-[24px] px-8 py-6 mb-4">
          <p className="text-black/40 text-xs uppercase tracking-wide font-medium mb-4">Informações</p>
          <div className="flex flex-col gap-4">
            <Row label="Nome completo" value={fullName || "—"} />
            <Row label="E-mail" value={user?.email ?? "—"} />
            <Row label="Empresa" value={user?.empresa?.nome_fantasia ?? "—"} />
            <Row label="CNPJ" value={user?.empresa?.cnpj ?? "—"} />
            {(user as { areaNome?: string })?.areaNome && (
              <Row label="Área" value={(user as { areaNome?: string }).areaNome!} />
            )}
            {(user as { cargoNome?: string })?.cargoNome && (
              <Row label="Cargo" value={(user as { cargoNome?: string }).cargoNome!} />
            )}
            {(user as { city?: string })?.city && (
              <Row
                label="Localização"
                value={`${(user as { city?: string }).city ?? ""}${(user as { uf_id?: number })?.uf_id ? "" : ""}`}
              />
            )}
            {(user as { bio?: string })?.bio && (
              <Row label="Bio" value={(user as { bio?: string }).bio!} />
            )}
          </div>
        </div>

        {/* Botão sair */}
        <div className="bg-white rounded-[24px] px-8 py-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-600 font-medium text-sm py-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-black/40 text-xs uppercase tracking-wide">{label}</span>
      <span className="text-black text-sm font-medium">{value}</span>
    </div>
  );
}
