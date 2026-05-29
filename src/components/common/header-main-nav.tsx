"use client";
// 헤더의 로고 링크와 주요 라우터 탭을 렌더링합니다.

import Logo from "@/components/common/logo";
import { useMainRoute } from "@/hooks/common/use-main-route";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const HEADER_MAIN_TABS = [
  {
    href: "/live",
    label: "라이브",
  },
  {
    href: "/chat",
    label: "채팅",
  },
] as const;

function resolveLogoHref(pathname: string, fallbackMainRoute: string) {
  if (pathname === "/") return "/";
  if (pathname.startsWith("/live")) return "/live";
  if (pathname.startsWith("/chat")) return "/chat";

  return fallbackMainRoute;
}

function isTabActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function HeaderMainNav() {
  const pathname = usePathname();
  const mainRoute = useMainRoute();
  const logoHref = resolveLogoHref(pathname, mainRoute);

  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-6">
      <Link href={logoHref} className="h-9 w-20 shrink-0 sm:w-38" aria-label="PixelPlay 홈">
        <Logo className="text-foreground h-full w-full [--logo-accent:var(--brand)]" />
      </Link>

      <nav className="flex shrink-0 items-center gap-1 sm:gap-2" aria-label="주요 메뉴">
        {HEADER_MAIN_TABS.map((tab) => {
          const active = isTabActive(pathname, tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "route-tab-link relative inline-flex h-9 items-center rounded-md border px-2 text-sm font-bold transition-colors sm:px-5",
                active
                  ? cn(
                      "text-foreground border-transparent after:absolute after:right-2 after:bottom-1 after:left-2 after:h-0.5 after:rounded-full",
                      "after:bg-foreground",
                    )
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
