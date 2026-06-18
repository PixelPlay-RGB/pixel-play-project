"use client";
// 쇼츠 뷰어 우측 액션 레일 버튼 — 툴팁 + 탭 스케일 피드백 + ON 글로우를 공통으로 묶는다.

import { type ReactNode } from "react";
import { motion } from "motion/react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// 우측 레일 공용 버튼 스타일 — 크게(size-12), hover는 opacity로 은은하게.
export const RAIL_BUTTON_CLASS =
  "flex size-12 cursor-pointer items-center justify-center rounded-full text-white opacity-90 backdrop-blur-sm transition-opacity hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30";
// ON 상태 — brand 채움 + 부드러운 brand 글로우 링(평면 단색보다 또렷하게).
const RAIL_ACTIVE_CLASS =
  "bg-brand text-brand-foreground opacity-100 shadow-lg shadow-brand/40 ring-2 ring-brand/40";

interface Props {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  active?: boolean;
  className?: string;
  children: ReactNode;
}

export function ClipRailButton({
  label,
  onClick,
  disabled,
  pressed,
  active,
  className,
  children,
}: Props) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <motion.button
            type="button"
            aria-label={label}
            aria-pressed={pressed}
            disabled={disabled}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className={cn(RAIL_BUTTON_CLASS, active ? RAIL_ACTIVE_CLASS : "bg-black/40", className)}
          >
            {children}
          </motion.button>
        }
      />
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );
}
