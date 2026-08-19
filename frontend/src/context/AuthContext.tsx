import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";
import { PlanState, User } from "@/lib/types";

interface AuthResponse {
  user: User;
  token: string;
}

interface RegisterResponse {
  user: User;
}

interface AuthContextValue {
  user: User | null;
  plan: PlanState | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshPlan: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadStoredUser(): User | null {
  const raw = localStorage.getItem("tino_user");
  return raw ? JSON.parse(raw) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser);
  const [plan, setPlan] = useState<PlanState | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshPlan = useCallback(async () => {
    try {
      const data = await api.get<PlanState>("/billing/plan");
      setPlan(data);
    } catch {
      setPlan(null);
    }
  }, []);

  // Busca o usuário atualizado no servidor — importante pra sincronizar coisas
  // como emailVerified quando ele muda numa aba/sessão diferente da que ficou
  // aberta (o localStorage guarda só o snapshot de quando a sessão começou).
  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get<{ user: User }>("/auth/me");
      localStorage.setItem("tino_user", JSON.stringify(data.user));
      setUser(data.user);
    } catch {
      // sessão inválida/expirada: deixa como está, a próxima chamada autenticada
      // vai receber 401 e o ProtectedRoute cuida de mandar pro login
    }
  }, []);

  useEffect(() => {
    if (user) refreshPlan();
  }, [user, refreshPlan]);

  // Só na carga inicial da aba — não depende de `user` pra não entrar em loop
  // (refreshUser troca a referência do objeto a cada chamada).
  useEffect(() => {
    if (loadStoredUser()) refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persistSession(data: AuthResponse) {
    localStorage.setItem("tino_token", data.token);
    localStorage.setItem("tino_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.post<AuthResponse>("/auth/login", { email, password });
      persistSession(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // Não loga o usuário automaticamente — incentiva a confirmar o e-mail antes,
  // mesmo o login não exigindo isso (ver loginUser no backend).
  const register = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      await api.post<RegisterResponse>("/auth/register", { name, email, password });
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("tino_token");
    localStorage.removeItem("tino_user");
    setUser(null);
    setPlan(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, plan, loading, login, register, logout, refreshPlan, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
