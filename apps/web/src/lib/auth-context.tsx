"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface User {
  id: string;
  loginEmail: string;
  firstName: string;
  lastName: string;
  displayName: string;
  companyId: string;
  companyName: string;
  jid_im: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface SignupData {
  loginEmail: string;
  password: string;
  firstName: string;
  lastName: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-renew token every 50 minutes (JWT lasts 1h)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/renew", { method: "POST" });
        if (!res.ok) {
          setUser(null);
        }
      } catch {
        // Silently fail — next navigation will trigger login
      }
    }, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Login failed");
    }
    const data = await res.json();
    // Use the typed email as fallback if API returns empty loginEmail
    const u = data.user;
    if (!u.loginEmail) u.loginEmail = email;
    setUser(u);
  };

  const signup = async (data: SignupData) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Signup failed");
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
