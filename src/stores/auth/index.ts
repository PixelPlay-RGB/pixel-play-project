import { create } from "zustand";
import { devtools } from "zustand/middleware"; // 미들웨어 추가
import { User } from "@supabase/supabase-js";

export interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      loading: true,
      setUser: (user) => set({ user, loading: false }, false, "auth/setUser"),
      setLoading: (loading) => set({ loading }, false, "auth/setLoading"),
    }),
    {
      name: "AuthStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);
