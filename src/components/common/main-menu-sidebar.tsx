"use client";

import ChatRoomList from "@/components/chat/chat-room-list";
import MainMenuSidebarItemRenderer from "@/components/common/main-menu-sidebar-item";
import LiveList from "@/components/live/live-list";
import { MAIN_MENU_SIDEBAR_ITEMS } from "@/constants/main-menu-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMainMenuStore } from "@/stores/main-menu";
import type { MainMenuSidebarKey } from "@/types/main-menu-sidebar";
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
        className="h-full shrink-0 border-r border-border bg-background"
      >
        <SidebarContent>
          <SidebarGroup className="p-4 pt-5">
            <SidebarGroupLabel className="mb-3 px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
          <div className="flex shrink-0 items-center gap-3 border-b border-border p-4">
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
