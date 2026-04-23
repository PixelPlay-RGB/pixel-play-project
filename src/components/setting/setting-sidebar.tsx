"use client";

import SettingMenuItem from "@/components/setting/setting-menu-item";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { SETTING_MENU } from "@/constants/setting-menu";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SettingSidebar() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <Sidebar className="top-14 h-[calc(100svh-3.5rem)]">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>설정</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SETTING_MENU.map((item) =>
                SettingMenuItem(item, {
                  onLogout: handleLogout,
                }),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
