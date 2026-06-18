// 작성 폼의 "현재/최대 글자수" 카운터. 한도 초과 시 destructive 색으로 전환한다.
// 커뮤니티 게시글/댓글 작성 폼이 동일한 천단위 포맷 + 초과 강조 스니펫을 공유하므로 한곳으로 모은다.

import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/common/format";

interface Props {
  current: number;
  max: number;
  className?: string;
}

export function CharacterCounter({ current, max, className }: Props) {
  return (
    <span
      className={cn(
        "text-muted-foreground text-xs font-semibold tabular-nums",
        current > max && "text-destructive",
        className,
      )}
    >
      {formatNumber(current)} / {formatNumber(max)}
    </span>
  );
}
