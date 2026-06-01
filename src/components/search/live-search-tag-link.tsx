// 라이브 검색 결과의 태그 검색 링크를 렌더링합니다.

import Link from "next/link";

import { cn } from "@/lib/utils";
import { createLiveSearchHref } from "@/utils/search/live-search";

interface LiveSearchTagLinkProps {
  tag: string;
}

export default function LiveSearchTagLink({ tag }: LiveSearchTagLinkProps) {
  return (
    <Link
      href={createLiveSearchHref(tag)}
      prefetch={false}
      className={cn(
        "bg-live/10 text-live dark:bg-live/15",
        "rounded-md px-2 py-0.5 text-xs font-black transition-colors",
        "hover:bg-live focus-visible:ring-ring outline-none hover:text-white focus-visible:ring-3",
      )}
      aria-label={`${tag} 태그 검색`}
    >
      #{tag}
    </Link>
  );
}
