// 사용자 후원 지갑 화면의 보조 탭 링크를 제공합니다.
import { cn } from "@/lib/utils";
import { buildUserDonationHref } from "@/utils/donations/user-donation-url";
import Link from "next/link";

const TAB_ITEMS = [{ href: buildUserDonationHref(), label: "후원 지갑" }] as const;

export function UserDonationTabs() {
  return (
    <nav className="border-border flex min-w-0 gap-8 overflow-x-auto border-b" aria-label="후원">
      {TAB_ITEMS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current="page"
          className={cn(
            "text-brand relative shrink-0 px-0.5 pb-3 text-lg font-black transition-colors",
            "focus-visible:ring-ring rounded-sm outline-none focus-visible:ring-3",
          )}
        >
          {tab.label}
          <span className="bg-brand absolute inset-x-0 -bottom-px h-0.5" />
        </Link>
      ))}
    </nav>
  );
}
