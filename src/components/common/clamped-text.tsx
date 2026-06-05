"use client";
// 여러 줄로 잘리는(line-clamp) 본문 미리보기. 실제로 잘렸을 때만 "더보기"를 덧붙인다.
// 개행은 textClassName의 whitespace-pre-wrap으로 보존된다(잘림 여부는 렌더 후 측정).

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface Props {
  text: string;
  /** 바깥 래퍼(레이아웃)에 적용 */
  className?: string;
  /** 본문 p에 적용 — line-clamp-N·whitespace-pre-wrap 등 */
  textClassName?: string;
  moreLabel?: string;
}

export default function ClampedText({
  text,
  className,
  textClassName,
  moreLabel = "더보기",
}: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // line-clamp 시 clientHeight는 잘린 높이, scrollHeight는 전체 높이.
    setIsClamped(el.scrollHeight - el.clientHeight > 1);
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    // 웹폰트 로드 후 메트릭이 바뀌면 다시 측정.
    document.fonts?.ready.then(measure).catch(() => {});

    return () => observer.disconnect();
  }, [measure, text]);

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-col", className)}>
      <p ref={ref} className={textClassName}>
        {text}
      </p>
      {isClamped && (
        <span className="text-muted-foreground mt-1 shrink-0 text-xs font-semibold">
          {moreLabel}
        </span>
      )}
    </div>
  );
}
