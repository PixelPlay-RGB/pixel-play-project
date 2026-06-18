"use client";
// 하위 메뉴를 가진 채널 사이드바 항목을 클릭 시 펼쳐지는 아코디언으로 렌더링합니다.
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { ChannelMenuItem } from "@/types/channel/channel-menu";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Props {
  item: ChannelMenuItem;
  isActive: boolean;
  isChildActive: (href: string) => boolean;
}

export default function ChannelSidebarMenuGroup({ item, isActive, isChildActive }: Props) {
  const Icon = item.icon;
  const [open, setOpen] = useState(isActive);

  // 사이드바는 라우트 이동 간 유지되므로, 활성 자식 경로로 직접 진입하면 그룹을 자동으로 펼칩니다.
  useEffect(() => {
    if (isActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true);
    }
  }, [isActive]);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        isActive={isActive}
        aria-expanded={open}
      >
        <Icon />
        <span>{item.label}</span>
        <ChevronDown
          className={cn("ml-auto size-4 transition-transform duration-200", open && "rotate-180")}
        />
      </SidebarMenuButton>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="submenu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <SidebarMenuSub>
              {item.children?.map((child) => (
                <SidebarMenuSubItem key={child.id}>
                  <SidebarMenuSubButton
                    render={<Link href={child.href} />}
                    isActive={isChildActive(child.href)}
                  >
                    <span>{child.label}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </motion.div>
        )}
      </AnimatePresence>
    </SidebarMenuItem>
  );
}
