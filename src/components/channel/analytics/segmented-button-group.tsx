"use client";
// 분석 화면에서 쓰는 세그먼트형 토글 버튼 그룹(기간/시간범위 선택의 공유 표면).
// 선택을 어떻게 반영할지(콜백/URL 등)는 호출부가 onSelect로 주입한다.

import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onSelect: (value: T) => void;
  ariaLabel: string;
}

export function SegmentedButtonGroup<T extends string>({
  options,
  value,
  onSelect,
  ariaLabel,
}: Props<T>) {
  // 라디오 그룹 키보드 탐색(←/→/Home/End)에서 포커스를 옮길 대상.
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusOption(index: number) {
    const target = options[index];
    if (!target) return;

    onSelect(target.value);
    buttonRefs.current[index]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = options.length - 1;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(index === lastIndex ? 0 : index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(index === 0 ? lastIndex : index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusOption(lastIndex);
    }
  }

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((option, index) => {
        const isActive = value === option.value;

        return (
          <Button
            key={option.value}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            type="button"
            size="sm"
            variant="outline"
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "text-xs font-bold transition-colors",
              isActive
                ? "border-brand bg-brand shadow-brand/25 hover:bg-brand/90 dark:border-brand! dark:bg-brand! dark:hover:bg-brand/90! text-white shadow-sm hover:text-white dark:text-white!"
                : "hover:border-brand/40 hover:bg-brand/5",
            )}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
