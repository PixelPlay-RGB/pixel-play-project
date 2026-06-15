"use client";
// 공개 채널 탭 내비게이션(홈/커뮤니티/클립). 다시보기(동영상)는 미구현이라 노출하지 않는다.

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface Props {
  creatorId: string;
}

interface ChannelTab {
  key: string;
  label: string;
  // 채널 베이스 경로 뒤에 붙는 경로(홈은 "").
  path: string;
  // exact=true면 정확히 일치할 때만 활성(홈).
  exact?: boolean;
}

const TABS: ChannelTab[] = [
  { key: "home", label: "홈", path: "", exact: true },
  { key: "community", label: "커뮤니티", path: "/community" },
  { key: "clips", label: "클립", path: "/clip" },
];

const tabClassName = cn(
  "relative shrink-0 px-1 py-3 text-sm font-bold transition-colors",
  "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full",
);

export default function ChannelTabs({ creatorId }: Props) {
  const pathname = usePathname();
  const basePath = `/channel/${creatorId}`;

  const isTabActive = (tab: ChannelTab) => {
    const href = `${basePath}${tab.path}`;
    if (tab.exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="border-border/60 flex items-center gap-6 border-b">
      {TABS.map((tab) => {
        const isActive = isTabActive(tab);

        return (
          <Link
            key={tab.key}
            href={`${basePath}${tab.path}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              tabClassName,
              isActive
                ? "text-brand after:bg-brand"
                : "text-muted-foreground hover:text-foreground after:bg-transparent",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
