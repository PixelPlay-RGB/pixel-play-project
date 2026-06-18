// 스티커 단일 이미지. 정적 public 경로·스토리지 URL 모두 next/image(unoptimized)로 렌더한다
// — GIF 애니메이션 보존 + 작은 이미지 다수라 최적화 우회가 더 저렴(<img> 직접 사용 금지 규칙 준수).
import Image from "next/image";

import { cn } from "@/lib/utils";
import type { Sticker } from "@/types/sticker/sticker";

interface Props {
  sticker: Sticker;
  // 렌더 한 변 px(정사각). STICKER_PX 값을 넘긴다.
  px: number;
  className?: string;
}

export default function StickerImage({ sticker, px, className }: Props) {
  return (
    <Image
      src={sticker.src}
      alt={sticker.label}
      width={px}
      height={px}
      unoptimized
      draggable={false}
      // align-middle: 본문 텍스트 사이에 인라인으로 끼워도 줄 중앙에 정렬된다.
      className={cn("inline-block max-w-none object-contain align-middle select-none", className)}
      style={{ width: px, height: px }}
    />
  );
}
