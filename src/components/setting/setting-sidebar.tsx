"use client";

import SettingMenuItem from "@/components/setting/setting-menu-item";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { SETTING_MENU } from "@/constants/setting-menu";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";
import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function SettingSidebar({ isMobile }: { isMobile?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const isCanChangePassword = useAuthStore((state) => state.isCanChangePassword);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const mainItems = SETTING_MENU.filter((item) => item.type !== "logout");

  return (
    <Sidebar
      collapsible={isMobile ? "offcanvas" : "none"}
      className="bg-background h-full shrink-0 border-r"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>설정</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className={"gap-1.5"}>
              {mainItems.map((item) =>
                SettingMenuItem(
                  item,
                  {
                    onLogout: handleLogout,
                    isActive: (href) => pathname === href,
                  },
                  isCanChangePassword,
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-0">
        <Separator />
        <div className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} className="text-muted-foreground">
                <LogOut />
                <span>로그아웃</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
