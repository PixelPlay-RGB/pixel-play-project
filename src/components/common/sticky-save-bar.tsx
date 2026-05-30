"use client";
// 변경사항 저장을 위한 화면 하단 플로팅 액션 바입니다.

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";

interface Props {
  show: boolean;
  isSaving: boolean;
  canSave?: boolean;
  saveLabel?: string;
  resetLabel?: string;
  onSave: () => void;
  onReset?: () => void;
}

export function StickySaveBar({
  show,
  isSaving,
  canSave = true,
  saveLabel = "변경사항 저장",
  resetLabel = "되돌리기",
  onSave,
  onReset,
}: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "fixed bottom-6 left-1/2 z-50 -translate-x-1/2",
            "flex items-center gap-3 rounded-2xl border px-3 py-2.5 pl-5",
            "border-brand/20 bg-background/90 shadow-brand/10 shadow-lg backdrop-blur-md",
          )}
        >
          <span className="text-muted-foreground hidden text-sm font-medium sm:inline">
            저장하지 않은 변경사항이 있어요.
          </span>
          <div className="flex items-center gap-2">
            {onReset && (
              <Button
                type="button"
                variant="outline"
                onClick={onReset}
                disabled={isSaving}
                className="rounded-xl font-semibold"
              >
                {resetLabel}
              </Button>
            )}
            <Button
              type="button"
              onClick={onSave}
              disabled={isSaving || !canSave}
              className={cn(
                "bg-brand hover:bg-brand/90 rounded-xl px-5 font-bold text-white",
                "shadow-brand/20 shadow-sm transition-all active:scale-95",
              )}
            >
              {isSaving ? <Spinner /> : saveLabel}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
