// 팔로잉 목록이 비어 있을 때 카드 안에서 보여줄 안내와 CTA를 렌더링합니다.

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
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="bg-brand/10 text-brand flex size-12 items-center justify-center rounded-full">
        <UserRoundPlus className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-foreground text-sm font-bold">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {showBrowseCta && (
        <Link
          href="/"
          className={cn(
            buttonVariants({ size: "lg" }),
            "bg-brand hover:bg-brand/90 text-brand-foreground mt-1 rounded-xl px-6 font-bold",
          )}
        >
          라이브 둘러보기
        </Link>
      )}
    </div>
  );
}
