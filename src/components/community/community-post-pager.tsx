// 게시글 상세의 이전 글 / 다음 글 네비게이션(치지직식).
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { CommunityAdjacentPosts } from "@/types/community/community";

interface Props {
  creatorId: string;
  neighbors: CommunityAdjacentPosts;
}

export default function CommunityPostPager({ creatorId, neighbors }: Props) {
  const base = `/channel/${creatorId}/community`;

  return (
    <nav className="border-border/60 divide-border/60 grid grid-cols-2 divide-x overflow-hidden rounded-2xl border">
      {neighbors.prev ? (
        <Link
          href={`${base}/${neighbors.prev.id}`}
          className="hover:bg-muted/40 flex items-center gap-2 px-4 py-3 transition-colors"
        >
          <ChevronLeft className="text-muted-foreground size-4 shrink-0" />
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-bold">이전 글</p>
            <p className="text-foreground/90 truncate text-sm">{neighbors.prev.content}</p>
          </div>
        </Link>
      ) : (
        <div className="text-muted-foreground/50 flex items-center gap-2 px-4 py-3 text-sm font-semibold">
          <ChevronLeft className="size-4 shrink-0" />
          이전 글 없음
        </div>
      )}

      {neighbors.next ? (
        <Link
          href={`${base}/${neighbors.next.id}`}
          className="hover:bg-muted/40 flex items-center justify-end gap-2 px-4 py-3 text-right transition-colors"
        >
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-bold">다음 글</p>
            <p className="text-foreground/90 truncate text-sm">{neighbors.next.content}</p>
          </div>
          <ChevronRight className="text-muted-foreground size-4 shrink-0" />
        </Link>
      ) : (
        <div className="text-muted-foreground/50 flex items-center justify-end gap-2 px-4 py-3 text-sm font-semibold">
          다음 글 없음
          <ChevronRight className="size-4 shrink-0" />
        </div>
      )}
    </nav>
  );
}
