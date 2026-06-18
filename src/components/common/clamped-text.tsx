"use client";
// 여러 줄로 잘리는(line-clamp) 본문 미리보기. 실제로 잘렸을 때만 "더보기"를 덧붙인다.
// 개행은 textClassName의 whitespace-pre-wrap으로 보존된다(잘림 여부는 렌더 후 측정).

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface Props {
  // 평문 — 스티커 이미지 등 리치 콘텐츠는 children으로 넘긴다(둘 중 하나).
  text?: string;
  children?: ReactNode;
  /** 바깥 래퍼(레이아웃)에 적용 */
  className?: string;
  /** 본문 p에 적용 — line-clamp-N·whitespace-pre-wrap 등 */
  textClassName?: string;
  moreLabel?: string;
}

export default function ClampedText({
  text,
  children,
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

    // 콘텐츠(text/children)·폰트·레이아웃 변화로 높이가 바뀌면 ResizeObserver가 다시 측정한다.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    document.fonts?.ready.then(measure).catch(() => {});

    return () => observer.disconnect();
  }, [measure, text, children]);

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-col", className)}>
      <p ref={ref} className={textClassName}>
        {children ?? text}
      </p>
      {isClamped && (
        <span className="text-muted-foreground mt-1 shrink-0 text-xs font-semibold">
          {moreLabel}
        </span>
      )}
    </div>
  );
}
