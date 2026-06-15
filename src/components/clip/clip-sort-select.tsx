"use client";
// 클립 정렬(인기순/최신순) Select — 시청 페이지 섹션과 채널 클립 탭이 공유한다.

import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectList,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLIP_SORT_OPTIONS } from "@/constants/clip/clip";
import { cn } from "@/lib/utils";
import type { ClipSort } from "@/types/clip/clip";

interface Props {
  value: ClipSort;
  onChange: (value: ClipSort) => void;
  className?: string;
}

export function ClipSortSelect({ value, onChange, className }: Props) {
  return (
    <Select
      value={value}
      items={CLIP_SORT_OPTIONS}
      onValueChange={(next) => onChange(next as ClipSort)}
    >
      <SelectTrigger aria-label="클립 정렬" className={cn("h-8 min-w-24 rounded-lg", className)}>
        <SelectValue />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent>
        <SelectList>
          {CLIP_SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} label={option.label}>
              {option.label}
            </SelectItem>
          ))}
        </SelectList>
      </SelectContent>
    </Select>
  );
}
