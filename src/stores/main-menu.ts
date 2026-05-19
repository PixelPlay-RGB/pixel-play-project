// 메인 메뉴의 활성 상태를 전역에서 공유합니다.
import type { MainMenuSidebarKey } from "@/types/common/main-menu-sidebar";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface MainMenuState {
  activeMenu: MainMenuSidebarKey;
  setActiveMenu: (activeMenu: MainMenuSidebarKey) => void;
}

export const useMainMenuStore = create<MainMenuState>()(
  devtools(
    (set) => ({
      activeMenu: "chat",
      setActiveMenu: (activeMenu) => set({ activeMenu }, false, "mainMenu/setActiveMenu"),
    }),
    {
      name: "MainMenuStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);
