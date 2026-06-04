// 게시글 상세 상단의 이전글/다음글 네비게이션(치지직식 컴팩트 버튼).
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CommunityAdjacentPosts } from "@/types/community/community";

interface Props {
  creatorId: string;
  neighbors: CommunityAdjacentPosts;
}

const BUTTON_BASE =
  "inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-semibold transition-colors";

export default function CommunityPostPager({ creatorId, neighbors }: Props) {
  const base = `/channel/${creatorId}/community`;

  return (
    <div className="flex items-center gap-1.5">
      {neighbors.prev ? (
        <Link
          href={`${base}/${neighbors.prev.id}`}
          className={cn(
            BUTTON_BASE,
            "border-border bg-background text-foreground hover:border-brand/40 hover:text-brand",
          )}
        >
          <ChevronLeft className="size-3.5" />
          이전글
        </Link>
      ) : (
        <span
          aria-disabled
          className={cn(BUTTON_BASE, "border-border/50 text-muted-foreground/50 cursor-default")}
        >
          <ChevronLeft className="size-3.5" />
          이전글
        </span>
      )}

      {neighbors.next ? (
        <Link
          href={`${base}/${neighbors.next.id}`}
          className={cn(
            BUTTON_BASE,
            "border-border bg-background text-foreground hover:border-brand/40 hover:text-brand",
          )}
        >
          다음글
          <ChevronRight className="size-3.5" />
        </Link>
      ) : (
        <span
          aria-disabled
          className={cn(BUTTON_BASE, "border-border/50 text-muted-foreground/50 cursor-default")}
        >
          다음글
          <ChevronRight className="size-3.5" />
        </span>
      )}
    </div>
  );
}
