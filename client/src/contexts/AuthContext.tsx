import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface UserMe {
  id: number;
  name: string;
  last_name: string;
  email: string;
  empresa_id: number | null;
  empresa: {
    id: number;
    nome_fantasia: string;
    cnpj: string;
  } | null;
}

interface AuthContextValue {
  token: string | null;
  user: UserMe | null;
  login: (token: string, empresaId: number) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loadingUser: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "addesk_token";
const EMPRESA_KEY = "addesk_empresa_id";

async function fetchMe(token: string, empresaId: number): Promise<UserMe> {
  const res = await fetch("https://api-prod-goon-app.up.railway.app/me", {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-empresa-id": String(empresaId),
    },
  });
  if (!res.ok) throw new Error("Sessão inválida");
  const json = await res.json();
  return json.data as UserMe;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [empresaId, setEmpresaId] = useState<number | null>(() => {
    const v = localStorage.getItem(EMPRESA_KEY);
    return v ? Number(v) : null;
  });
  const [user, setUser] = useState<UserMe | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(
    !!localStorage.getItem(TOKEN_KEY) && !!localStorage.getItem(EMPRESA_KEY)
  );

  useEffect(() => {
    if (!token || !empresaId) {
      setUser(null);
      setLoadingUser(false);
      return;
    }
    setLoadingUser(true);
    fetchMe(token, empresaId)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EMPRESA_KEY);
        setToken(null);
        setEmpresaId(null);
        setUser(null);
      })
      .finally(() => setLoadingUser(false));
  }, [token, empresaId]);

  function login(t: string, eId: number) {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(EMPRESA_KEY, String(eId));
    setEmpresaId(eId);
    setToken(t);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMPRESA_KEY);
    setToken(null);
    setEmpresaId(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token, loadingUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
