import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("https://api-prod-goon-app.up.railway.app/auth", {
        method: "POST",
        headers: {
          "Accept": "application/json, text/plain, */*",
          "Content-Type": "application/json",
          "withoutAuth": "true",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "E-mail ou senha inválidos.");
        return;
      }

      const token = data?.token?.token ?? data?.access_token ?? data?.accessToken;
      if (!token || typeof token !== "string") {
        setError("Resposta inesperada do servidor.");
        return;
      }

      const empresaId: number | null = data?.me?.empresa_id ?? null;
      if (!empresaId) {
        setError("Usuário sem empresa vinculada.");
        return;
      }

      login(token, empresaId);
      navigate("/");
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f1f1] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="w-full bg-[#153ece] rounded-[34px] px-8 py-8 mb-6 flex flex-col items-center gap-3">
          <img src="/1-426.svg" alt="Logo" className="h-12 brightness-0 invert" />
          <div className="text-center">
            <h1 className="text-white text-2xl font-medium leading-tight">AD Desk</h1>
            <p className="text-white/70 text-sm mt-0.5">Acesse sua conta</p>
          </div>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-[24px] px-8 py-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-black/50 text-xs uppercase tracking-wide font-medium">
                E-mail
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#f1f1f1] rounded-xl px-4 py-3 text-sm text-black placeholder:text-black/30 outline-none focus:ring-2 focus:ring-[#153ece]/40 transition"
                placeholder="seu@email.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-black/50 text-xs uppercase tracking-wide font-medium">
                Senha
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#f1f1f1] rounded-xl px-4 py-3 text-sm text-black placeholder:text-black/30 outline-none focus:ring-2 focus:ring-[#153ece]/40 transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#153ece] hover:bg-[#1233b0] disabled:opacity-60 text-white font-medium text-sm py-3 rounded-xl transition-colors mt-1"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
