import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { api } from "@/lib/api";
import { User } from "@/lib/types";

interface AuthResponse {
  user: User;
  token: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadStoredUser(): User | null {
  const raw = localStorage.getItem("tino_user");
  return raw ? JSON.parse(raw) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser);
  const [loading, setLoading] = useState(false);

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
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
