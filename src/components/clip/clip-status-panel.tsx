"use client";
// 클립 에디터 풀블리드 안에서 가운데 정렬되는 상태 패널(직접 진입 안내·생성 완료).

import { type ReactNode } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const TONE_CLASS = {
  brand: "bg-brand/10 text-brand",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
} as const;

interface ClipStatusPanelProps {
  tone: keyof typeof TONE_CLASS;
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}

export function ClipStatusPanel({
  tone,
  icon,
  title,
  description,
  children,
}: ClipStatusPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center"
    >
      <span
        className={cn("flex size-16 items-center justify-center rounded-2xl", TONE_CLASS[tone])}
      >
        {icon}
      </span>
      <div className="space-y-1">
        <p className="text-foreground text-base font-bold">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {children}
    </motion.div>
  );
}
