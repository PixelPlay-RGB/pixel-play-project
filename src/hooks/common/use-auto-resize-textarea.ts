"use client";
// textarea 값을 기준으로 높이와 내부 스크롤 노출을 조절하는 hook
import { useEffect, type RefObject } from "react";

interface UseAutoResizeTextareaOptions {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  maxHeightPx: number;
}

export function useAutoResizeTextarea({
  textareaRef,
  value,
  maxHeightPx,
}: UseAutoResizeTextareaOptions) {
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const nextHeight = textarea.scrollHeight;
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = nextHeight > maxHeightPx ? "auto" : "hidden";
  }, [maxHeightPx, textareaRef, value]);
}
