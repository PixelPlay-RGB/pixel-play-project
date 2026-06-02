"use client";
// 공개 채널 탭 내비게이션. 커뮤니티만 활성, 나머지는 준비중 안내합니다.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

interface Props {
  creatorId: string;
}

interface ChannelTab {
  key: string;
  label: string;
  ready: boolean;
}

const TABS: ChannelTab[] = [
  { key: "community", label: "커뮤니티", ready: true },
  { key: "videos", label: "동영상", ready: false },
  { key: "clips", label: "클립", ready: false },
  { key: "about", label: "정보", ready: false },
];

const tabClassName = cn(
  "relative shrink-0 px-1 py-3 text-sm font-bold transition-colors",
  "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full",
);

export default function ChannelTabs({ creatorId }: Props) {
  const pathname = usePathname();
  const communityHref = `/channel/${creatorId}/community`;
  const isCommunityActive =
    pathname === `/channel/${creatorId}` || pathname.startsWith(communityHref);

  const handleNotReady = (label: string) => {
    toast(`${label} 기능은 준비 중이에요`);
  };

  return (
    <nav className="border-border/60 flex items-center gap-6 border-b">
      {TABS.map((tab) => {
        if (!tab.ready) {
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleNotReady(tab.label)}
              className={cn(
                tabClassName,
                "text-muted-foreground/60 hover:text-muted-foreground cursor-pointer after:bg-transparent",
              )}
            >
              {tab.label}
            </button>
          );
        }

        return (
          <Link
            key={tab.key}
            href={communityHref}
            aria-current={isCommunityActive ? "page" : undefined}
            className={cn(
              tabClassName,
              isCommunityActive
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
