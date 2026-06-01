// 팔로잉 목록이 비어 있을 때의 안내와 CTA를 렌더링합니다.

import Link from "next/link";
import { UserRoundPlus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FollowingEmptyStateProps {
  title: string;
  description: string;
  showBrowseCta?: boolean;
}

export default function FollowingEmptyState({
  title,
  description,
  showBrowseCta = false,
}: FollowingEmptyStateProps) {
  return (
    <div className="border-border flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed px-6 py-16 text-center">
      <div className="bg-brand/10 text-brand flex size-14 items-center justify-center rounded-full">
        <UserRoundPlus className="size-7" />
      </div>
      <div className="space-y-1">
        <p className="text-foreground text-base font-bold">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {showBrowseCta ? (
        <Link
          href="/live"
          className={cn(
            buttonVariants({ size: "lg" }),
            "bg-brand hover:bg-brand/85 mt-1 rounded-full px-5 font-bold text-white",
          )}
        >
          라이브 둘러보기
        </Link>
      ) : null}
    </div>
  );
}
