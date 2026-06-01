"use client";
// 변경사항 저장을 위한 화면 하단 플로팅 액션 바입니다. (드래그로 위치 이동 가능)

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { GripVertical } from "lucide-react";

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
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
        >
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.18}
            whileDrag={{ scale: 1.02, cursor: "grabbing" }}
            className={cn(
              "pointer-events-auto flex cursor-grab items-center gap-2 rounded-2xl border py-2.5 pr-3 pl-2.5 active:cursor-grabbing",
              "border-brand/20 bg-background/90 shadow-brand/10 shadow-lg backdrop-blur-md",
            )}
          >
            <GripVertical
              className="text-muted-foreground/40 size-4 shrink-0 select-none"
              aria-hidden
            />
            <span className="text-muted-foreground mr-1 hidden text-sm font-medium sm:inline">
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
