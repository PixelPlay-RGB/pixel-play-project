"use client";
// 분석 화면에서 쓰는 세그먼트형 토글 버튼 그룹(기간/시간범위 선택의 공유 표면).
// 선택을 어떻게 반영할지(콜백/URL 등)는 호출부가 onSelect로 주입한다.

import { Button } from "@/components/ui/button";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onSelect: (value: T) => void;
}

export function SegmentedButtonGroup<T extends string>({ options, value, onSelect }: Props<T>) {
  return (
    <div className="flex gap-1">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={value === option.value ? "default" : "ghost"}
          onClick={() => onSelect(option.value)}
          aria-pressed={value === option.value}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
