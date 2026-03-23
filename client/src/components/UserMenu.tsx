import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User } from "lucide-react";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const firstName = user?.name ?? "";
  const lastName = user?.last_name ?? "";
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Avatar + nome → link para perfil */}
      <button
        onClick={() => navigate("/profile")}
        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-2xl px-3 py-1.5"
      >
        <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {initials || <User className="w-3.5 h-3.5" />}
        </div>
        <span className="text-white text-sm font-medium hidden sm:block leading-none">
          {firstName || "Perfil"}
        </span>
      </button>

      {/* Botão sair */}
      <button
        onClick={handleLogout}
        title="Sair"
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors rounded-2xl px-3 py-1.5 text-white text-sm font-medium"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:block">Sair</span>
      </button>
    </div>
  );
}
