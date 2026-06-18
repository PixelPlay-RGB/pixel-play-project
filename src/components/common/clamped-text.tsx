"use client";
// 여러 줄로 잘리는(line-clamp) 본문. 실제로 잘렸을 때만 "더보기"를 덧붙인다.
// 개행은 textClassName의 whitespace-pre-wrap으로 보존된다(잘림 여부는 렌더 후 측정).
// expandable=false(기본): "더보기"는 정적 표시(카드처럼 바깥이 상세로 이동하는 맥락).
// expandable=true: "더보기"가 인라인 펼침 토글이 되고, 펼치면 "접기"로 바뀐다(댓글 등 상세 내 본문).

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
  lessLabel?: string;
  /** "더보기"를 인라인 펼침/접기 토글로 만든다(상세 내 본문용). */
  expandable?: boolean;
}

export default function ClampedText({
  text,
  children,
  className,
  textClassName,
  moreLabel = "더보기",
  lessLabel = "접기",
  expandable = false,
}: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    // 펼친 상태에선 clamp가 해제돼 scrollHeight==clientHeight가 되므로 측정하지 않는다
    // (잘림 표시가 false로 꺼져 "접기" 버튼이 사라지는 것 방지).
    if (!el || isExpanded) return;
    // line-clamp 시 clientHeight는 잘린 높이, scrollHeight는 전체 높이.
    setIsClamped(el.scrollHeight - el.clientHeight > 1);
  }, [isExpanded]);

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

  const showToggle = expandable && (isClamped || isExpanded);

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-col", className)}>
      <p ref={ref} className={cn(textClassName, expandable && isExpanded && "line-clamp-none")}>
        {children ?? text}
      </p>
      {showToggle ? (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-muted-foreground hover:text-foreground mt-1 self-start text-xs font-semibold"
        >
          {isExpanded ? lessLabel : moreLabel}
        </button>
      ) : (
        !expandable &&
        isClamped && (
          <span className="text-muted-foreground mt-1 shrink-0 text-xs font-semibold">
            {moreLabel}
          </span>
        )
      )}
    </div>
  );
}
