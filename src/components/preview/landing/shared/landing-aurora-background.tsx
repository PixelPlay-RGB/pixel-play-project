// 랜딩 프리뷰의 오로라 조명 배경을 렌더링합니다.
"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { LANDING_AURORA_BLOBS } from "@/constants/preview/landing-aurora-background";
import { cn } from "@/lib/utils";
import type { LandingAuroraVariant } from "@/types/preview/landing-preview";

export function LandingAuroraBackground({ variant = "hero" }: { variant?: LandingAuroraVariant }) {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(backgroundRef, { margin: "80px" });

  return (
    <div ref={backgroundRef} className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      <div
        className={cn(
          "absolute inset-0 opacity-[0.04]",
          "bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)]",
          "bg-size-[64px_64px]",
          "mask-[radial-gradient(ellipse_at_center,black_30%,transparent_75%)]",
        )}
      />
      {LANDING_AURORA_BLOBS[variant].map((blob) => (
        <motion.div
          key={blob.tone}
          data-aurora-blob={`${variant}-${blob.tone}`}
          className={cn(
            "absolute size-72 rounded-full blur-[48px] sm:size-88 sm:blur-3xl",
            "transform-gpu mix-blend-normal will-change-transform",
            "lg:size-180 lg:mix-blend-screen",
            blob.className,
          )}
          style={blob.style}
          animate={isInView ? blob.animate : { opacity: 0, scale: 0.9, x: "0vw", y: "0vh" }}
          transition={
            isInView
              ? { ...blob.transition, repeat: Infinity, ease: "linear" }
              : { duration: 0.4, ease: "linear" }
          }
        />
      ))}
    </div>
  );
}
