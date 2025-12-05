import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

export type UserRole = "CLIENT" | "RESTAURANT" | "COURIER" | "ADMIN";

export type AuthUser = {
  id: number;
  username: string;
  role: UserRole;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  refreshMe: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshMe() {
    try {
      setLoading(true);
      const data = await api.get("/auth/me/");
      setUser(data);
      setError(null);
    } catch (err: any) {
      setUser(null);
      if (err?.status !== 401) {
        setError(err?.data?.detail || "Ошибка проверки авторизации");
      } else {
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await api.post("/auth/logout/");
    } catch {
      // ничего страшного
    } finally {
      setUser(null);
    }
  }

  useEffect(() => {
    // при загрузке страницы пробуем узнать, кто залогинен
    refreshMe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, refreshMe, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}