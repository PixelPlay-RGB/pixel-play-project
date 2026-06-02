// 사용자 후원 지갑의 상위 탭과 사용 내역 세부 필터를 표시합니다.
import { cn } from "@/lib/utils";
import type { UserDonationFilter, UserDonationTab } from "@/types/donations/user-donations";
import { buildUserDonationHref } from "@/utils/donations/user-donation-url";
import Link from "next/link";

interface Props {
  filter: UserDonationFilter;
}

const TAB_ITEMS: Array<{ value: UserDonationTab; label: string }> = [
  { value: "usage", label: "사용 내역" },
  { value: "purchase", label: "구매 내역" },
  { value: "free", label: "무료 지급" },
];

const USAGE_KIND_ITEMS = [
  { value: "normal", label: "일반" },
  { value: "party", label: "파티 후원" },
] as const;

export function UserDonationTabs({ filter }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <nav
        className="border-border flex min-w-0 gap-8 overflow-x-auto border-b"
        aria-label="후원 내역"
      >
        {TAB_ITEMS.map((tab) => {
          const isActive = filter.tab === tab.value;

          return (
            <Link
              key={tab.value}
              href={buildUserDonationHref(filter, { tab: tab.value })}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative shrink-0 px-0.5 pb-3 text-lg font-black transition-colors",
                "focus-visible:ring-ring rounded-sm outline-none focus-visible:ring-3",
                isActive ? "text-brand" : "text-foreground hover:text-brand",
              )}
            >
              {tab.label}
              {isActive && <span className="bg-brand absolute inset-x-0 -bottom-px h-0.5" />}
            </Link>
          );
        })}
      </nav>

      {filter.tab === "usage" && (
        <div className="flex gap-2">
          {USAGE_KIND_ITEMS.map((item) => {
            const isActive = filter.usageKind === item.value;

            return (
              <Link
                key={item.value}
                href={buildUserDonationHref(filter, { usageKind: item.value })}
                className={cn(
                  "flex h-9 items-center rounded-full px-4 text-sm font-bold transition-colors",
                  "focus-visible:ring-ring outline-none focus-visible:ring-3",
                  isActive
                    ? "bg-brand/15 text-brand"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
