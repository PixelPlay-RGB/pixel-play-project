"use client";
// 공개 채널 탭 내비게이션(홈/커뮤니티/동영상/클립). 동영상은 준비중 안내.

import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { cn } from "@/lib/utils";
import { toastAppInfo } from "@/utils/common/toast-message";

interface Props {
  creatorId: string;
}

interface ChannelTab {
  key: string;
  label: string;
  ready: boolean;
  // 채널 베이스 경로 뒤에 붙는 경로(홈은 ""). ready 탭만 사용.
  path?: string;
  // exact=true면 정확히 일치할 때만 활성(홈).
  exact?: boolean;
}

const TABS: ChannelTab[] = [
  { key: "home", label: "홈", ready: true, path: "", exact: true },
  { key: "community", label: "커뮤니티", ready: true, path: "/community" },
  { key: "videos", label: "동영상", ready: false },
  { key: "clips", label: "클립", ready: true, path: "/clip" },
];

const tabClassName = cn(
  "relative shrink-0 px-1 py-3 text-sm font-bold transition-colors",
  "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full",
);

export default function ChannelTabs({ creatorId }: Props) {
  const pathname = usePathname();
  const basePath = `/channel/${creatorId}`;

  const handleNotReady = (label: string) => {
    toastAppInfo(
      APP_MESSAGE_CODE.info.common.featureNotReady,
      `${label} 탭은 곧 제공될 예정이에요.`,
    );
  };

  const isTabActive = (tab: ChannelTab) => {
    if (!tab.ready || tab.path === undefined) {
      return false;
    }
    const href = `${basePath}${tab.path}`;
    if (tab.exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="border-border/60 flex items-center gap-6 border-b">
      {TABS.map((tab) => {
        if (!tab.ready || tab.path === undefined) {
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
