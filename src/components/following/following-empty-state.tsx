// 팔로잉 목록이 비어 있을 때 카드 안에서 보여줄 안내와 CTA를 렌더링합니다.
// 빈 상태 마크업은 공용 EmptyState(차분한 muted 톤)에 위임하고, CTA만 덧붙인다.

import Link from "next/link";
import { UserRoundPlus } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
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
    <EmptyState
      icon={<UserRoundPlus className="size-7" />}
      title={title}
      description={description}
      action={
        showBrowseCta ? (
          <Link
            href="/"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-brand hover:bg-brand/90 text-brand-foreground mt-1 rounded-xl px-6 font-bold",
            )}
          >
            라이브 둘러보기
          </Link>
        ) : undefined
      }
    />
  );
}
