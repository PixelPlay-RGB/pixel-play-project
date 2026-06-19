// 현재 시각(Date.now())에 의존하는 상대 시간 표기를 hydration 안전하게 렌더한다.
// 서버 SSR 시점과 클라 hydration 시점의 Date.now()가 달라 "방금 전"/"N분 전"
// 텍스트가 어긋나면 React #418(텍스트 불일치)이 발생하므로 suppressHydrationWarning으로
// 억제하고, <time dateTime>으로 시맨틱·접근성을 확보한다.

import { formatRelativeTime } from "@/utils/common/format";

interface Props {
  iso: string;
  className?: string;
}

export default function RelativeTime({ iso, className }: Props) {
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {formatRelativeTime(iso)}
    </time>
  );
}
