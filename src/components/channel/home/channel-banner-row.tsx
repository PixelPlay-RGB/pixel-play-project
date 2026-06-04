// 채널 홈 배너 줄. 관리에서 등록한 외부 링크 배너를 가로로 노출(새 탭).
import Image from "next/image";

import type { ChannelBanner } from "@/types/channel/channel";

interface Props {
  banners: ChannelBanner[];
}

export function ChannelBannerRow({ banners }: Props) {
  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      {banners.map((banner) => (
        <a
          key={banner.id}
          href={banner.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex w-24 shrink-0 flex-col gap-1.5"
        >
          <div className="border-border/60 group-hover:border-brand/40 relative aspect-square overflow-hidden rounded-xl border transition-colors">
            <Image
              src={banner.imageUrl}
              alt={banner.title || "채널 배너"}
              fill
              sizes="96px"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          </div>
          {banner.title && (
            <span className="text-muted-foreground group-hover:text-foreground truncate text-center text-xs font-semibold transition-colors">
              {banner.title}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}
