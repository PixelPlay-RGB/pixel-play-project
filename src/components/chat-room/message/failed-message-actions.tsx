"use client";
// 전송 실패한 optimistic 메시지의 재전송과 취소 액션을 표시하는 컴포넌트

import { RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  disabled?: boolean;
  onRetry: () => void;
  onCancel: () => void;
}

export function FailedMessageActions({ disabled = false, onRetry, onCancel }: Props) {
  return (
    <div className="mt-1 flex justify-end gap-1.5 text-xs">
      <Button
        type="button"
        size="xs"
        variant="ghost"
        disabled={disabled}
        onClick={onRetry}
        aria-label="메시지 재전송"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <RotateCcw className="size-3" />
        재전송
      </Button>
      <Button
        type="button"
        size="xs"
        variant="ghost"
        disabled={disabled}
        onClick={onCancel}
        aria-label="전송 실패 메시지 취소"
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="size-3" />
        취소
      </Button>
    </div>
  );
}
