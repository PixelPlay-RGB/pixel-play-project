import { AuthUser } from "@/types/user";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface UserState {
  user: AuthUser | null;
  loading: boolean;
  isCanChangePassword: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setIsCanChangePassword: (isCan: boolean) => void;
}

/**
 * Supabase auth 기반 인증 유저 store.
 * 프로필(public.user) 데이터는 React Query의 useProfile 훅을 사용할 것.
 */
export const useAuthStore = create<UserState>()(
  devtools(
    (set) => ({
      user: null,
      loading: true,
      isCanChangePassword: false,
      setUser: (user) => set({ user, loading: false }, false, "auth/setUser"),
      setLoading: (loading) => set({ loading }, false, "auth/setLoading"),
      setIsCanChangePassword: (isCan) => set({ isCanChangePassword: isCan }),
    }),
    {
      name: "AuthStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);
