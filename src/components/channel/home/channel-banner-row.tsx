// 채널 홈 배너 줄. 관리에서 등록한 외부 링크 배너 이미지를 가로로 노출(새 탭).
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
    <div className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
      {banners.map((banner) => (
        <a
          key={banner.id}
          href={banner.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group block w-44 shrink-0 sm:w-52"
          title={banner.title || undefined}
        >
          <div className="border-border/60 group-hover:border-brand/40 relative aspect-square overflow-hidden rounded-2xl border transition-colors">
            <Image
              src={banner.imageUrl}
              alt={banner.title || "채널 배너"}
              fill
              sizes="(min-width: 640px) 208px, 176px"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          </div>
        </a>
      ))}
    </div>
  );
}
