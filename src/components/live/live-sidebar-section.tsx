"use client";
// 라이브 Sidebar의 접이식 섹션을 렌더링합니다.

import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";
import {
  liveSidebarSectionContentTransition,
  liveSidebarSectionContentVariants,
} from "@/lib/framer-motion/live-sidebar";
import { cn } from "@/lib/utils";

interface LiveSidebarSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function LiveSidebarSection({
  title,
  children,
  defaultOpen = true,
  onOpenChange,
}: LiveSidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    onOpenChange?.(next);
  };

  return (
    <SidebarGroup>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={handleToggle}
        className={cn(
          "text-sidebar-foreground/70 ring-sidebar-ring flex h-8 w-full items-center rounded-md px-2 text-xs font-medium outline-hidden transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
        )}
      >
        <span className="min-w-0 flex-1 truncate text-left">{title}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform", isOpen ? "rotate-180" : "rotate-0")}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="content"
            initial="closed"
            animate="open"
            exit="closed"
            variants={liveSidebarSectionContentVariants}
            transition={liveSidebarSectionContentTransition}
            className="overflow-hidden"
          >
            <SidebarGroupContent>{children}</SidebarGroupContent>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </SidebarGroup>
  );
}
