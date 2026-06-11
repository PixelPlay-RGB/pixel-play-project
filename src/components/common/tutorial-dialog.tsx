"use client";
// 캡처 이미지와 단계 설명을 Dialog로 보여주는 공용 튜토리얼 컴포넌트입니다.

import { HintNote } from "@/components/common/hint-note";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CircleHelp, Maximize2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";

export interface TutorialStep {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt?: string;
}

interface Props {
  title: string;
  steps: TutorialStep[];
  trigger?: ReactElement;
  triggerLabel?: string;
}

export function TutorialDialog({ title, steps, trigger, triggerLabel = "가이드 보기" }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const currentStep = steps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  // 확대 중 ESC는 Dialog가 아니라 확대 보기만 닫도록 capture 단계에서 가로챕니다.
  useEffect(() => {
    if (!isZoomed) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setIsZoomed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isZoomed]);

  if (!currentStep) return null;

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) setStepIndex(0);
        if (!open) setIsZoomed(false);
      }}
    >
      <DialogTrigger
        render={
          trigger ?? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground -ml-1 translate-y-px"
              aria-label={triggerLabel}
            >
              <CircleHelp className="size-4" />
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-[92vw] 2xl:max-w-[1400px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {stepIndex + 1}단계 · {currentStep.title}
          </DialogDescription>
        </DialogHeader>

        <button
          type="button"
          aria-label="이미지 확대 보기"
          onClick={() => setIsZoomed(true)}
          // 헤더·설명·내비게이션과 합쳐 Dialog 최대 높이(94vh)를 넘지 않도록 이미지 높이를 제한한다.
          // 디테일은 클릭 확대 보기로 확인하는 전제라 작게 보여도 괜찮다.
          className="border-border bg-muted/40 hover:border-brand/60 group relative h-[52vh] min-h-64 w-full overflow-hidden rounded-xl border transition-colors duration-150"
        >
          <Image
            src={currentStep.imageSrc}
            alt={currentStep.imageAlt ?? currentStep.title}
            fill
            sizes="(max-width: 1536px) 92vw, 1400px"
            className="object-contain"
            unoptimized
          />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-150 group-hover:bg-black/20 group-hover:opacity-100">
            <span className="bg-background/95 text-foreground border-brand/40 flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold shadow-lg">
              <Maximize2 className="text-brand size-3.5" />
              클릭하면 크게 볼 수 있어요
            </span>
          </span>
        </button>

        <HintNote className="text-sm leading-6 whitespace-pre-line">
          {currentStep.description}
        </HintNote>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={isFirstStep}
            onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}
          >
            <ChevronLeft />
            이전
          </Button>

          <div className="flex items-center gap-1.5">
            {steps.map((step, index) => (
              <button
                // 같은 캡처 이미지를 여러 단계가 재사용할 수 있어 imageSrc는 key로 쓰지 않는다.
                key={`${index}-${step.title}`}
                type="button"
                aria-label={`${index + 1}단계로 이동`}
                onClick={() => setStepIndex(index)}
                className={cn(
                  "size-2 rounded-full transition-colors",
                  index === stepIndex ? "bg-foreground" : "bg-muted-foreground/30",
                )}
              />
            ))}
          </div>

          {isLastStep ? (
            <DialogClose render={<Button type="button">완료</Button>} />
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStepIndex((index) => Math.min(index + 1, steps.length - 1))}
            >
              다음
              <ChevronRight />
            </Button>
          )}
        </div>
      </DialogContent>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isZoomed && (
              <motion.div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-2 backdrop-blur-sm sm:p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                onClick={() => setIsZoomed(false)}
              >
                <motion.div
                  className="relative h-full w-full"
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.97, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                >
                  <Image
                    src={currentStep.imageSrc}
                    alt={currentStep.imageAlt ?? currentStep.title}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    unoptimized
                  />
                </motion.div>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute top-4 right-4"
                  aria-label="확대 닫기"
                >
                  <X className="size-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </Dialog>
  );
}
