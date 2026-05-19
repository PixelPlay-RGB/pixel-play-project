"use client";
// main-menu-sidebar 컴포넌트를 제공합니다.

import ChatRoomList from "@/components/chat-room-list/chat-room-list";
import MainMenuSidebarItemRenderer from "@/components/common/main-menu-sidebar-item";
import LiveList from "@/components/live/live-list";
import { MAIN_MENU_SIDEBAR_ITEMS } from "@/constants/common/main-menu-sidebar";
import { useIsMobile } from "@/hooks/common/use-mobile";
import { useMainMenuStore } from "@/stores/main-menu";
import { cn } from "@/lib/utils";
import type { MainMenuSidebarKey } from "@/types/common/main-menu-sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface Props {
  activeMenu: MainMenuSidebarKey;
  setActiveMenu: (menu: MainMenuSidebarKey) => void;
}

function Items({ activeMenu, setActiveMenu }: Props) {
  const { isMobile, setOpenMobile } = useSidebar();

  const handleMenuChange = (menu: MainMenuSidebarKey) => {
    setActiveMenu(menu);

    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenu className="flex-col gap-1">
      {MAIN_MENU_SIDEBAR_ITEMS.map((item) =>
        MainMenuSidebarItemRenderer(item, {
          activeMenu,
          onMenuChange: handleMenuChange,
        }),
      )}
    </SidebarMenu>
  );
}

export default function MainMenuSidebar() {
  const activeMenu = useMainMenuStore((state) => state.activeMenu);
  const setActiveMenu = useMainMenuStore((state) => state.setActiveMenu);
  const isMobile = useIsMobile();

  return (
    <SidebarProvider className="h-app-content min-h-0 overflow-hidden">
      <Sidebar
        collapsible={isMobile ? "offcanvas" : "none"}
        className="border-border bg-background h-full shrink-0 border-r"
      >
        <SidebarContent>
          <SidebarGroup className="p-4 pt-5">
            <SidebarGroupLabel
              className={cn(
                "mb-3 px-2 text-xs font-semibold tracking-wider uppercase",
                "text-muted-foreground",
              )}
            >
              메뉴
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <Items activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        {isMobile && (
          <div className="border-border flex shrink-0 items-center gap-3 border-b p-4">
            <SidebarTrigger className="cursor-pointer" />
            <span className="text-foreground text-sm font-semibold">
              {MAIN_MENU_SIDEBAR_ITEMS.find((item) => item.key === activeMenu)?.label}
            </span>
          </div>
        )}
        <div className="h-full overflow-auto p-4 md:p-6">
          {activeMenu === "chat" ? <ChatRoomList /> : <LiveList />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
