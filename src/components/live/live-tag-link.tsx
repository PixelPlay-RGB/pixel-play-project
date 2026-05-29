// 라이브 태그 검색 링크 chip을 렌더링합니다.

import Link from "next/link";

import { cn } from "@/lib/utils";
import { createLiveSearchHref } from "@/utils/live/live-list";

const LIVE_TAG_LINK_VARIANT_CLASS = {
  default: "px-2 py-0.5",
  overlay: "px-2 py-1 backdrop-blur",
} as const;

interface LiveTagLinkProps {
  tag: string;
  variant?: keyof typeof LIVE_TAG_LINK_VARIANT_CLASS;
}

export default function LiveTagLink({ tag, variant = "default" }: LiveTagLinkProps) {
  return (
    <Link
      href={createLiveSearchHref(tag)}
      className={cn(
        "bg-brand/15 text-brand border-brand/20 hover:bg-brand hover:text-brand-foreground focus-visible:ring-ring rounded-full border text-xs font-bold transition-colors outline-none focus-visible:ring-3",
        LIVE_TAG_LINK_VARIANT_CLASS[variant],
      )}
    >
      #{tag}
    </Link>
  );
}
