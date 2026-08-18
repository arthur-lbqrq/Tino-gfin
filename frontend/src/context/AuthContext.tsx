import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";
import { PlanState, User } from "@/lib/types";

interface AuthResponse {
  user: User;
  token: string;
}

interface AuthContextValue {
  user: User | null;
  plan: PlanState | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshPlan: () => Promise<void>;
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

  useEffect(() => {
    if (user) refreshPlan();
  }, [user, refreshPlan]);

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

  const register = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.post<AuthResponse>("/auth/register", { name, email, password });
      persistSession(data);
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
    <AuthContext.Provider value={{ user, plan, loading, login, register, logout, refreshPlan }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
