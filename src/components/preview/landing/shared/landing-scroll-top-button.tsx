// 랜딩 프리뷰에서 최상단으로 이동하는 플로팅 버튼을 렌더링합니다.
"use client";

import { ArrowUp } from "lucide-react";
import { animate, type AnimationPlaybackControls } from "motion";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SCROLL_TOP_VISIBLE_Y = 360;
const SCROLL_TOP_DURATION = 0.9;
const SCROLL_TOP_EASE = [0.4, 0, 0.2, 1] as const;

export function LandingScrollTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const animationRef = useRef<AnimationPlaybackControls | null>(null);

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY > SCROLL_TOP_VISIBLE_Y);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => {
      animationRef.current?.stop();
      window.removeEventListener("scroll", updateVisibility);
    };
  }, []);

  const handleScrollTop = () => {
    animationRef.current?.stop();
    animationRef.current = animate(window.scrollY, 0, {
      duration: SCROLL_TOP_DURATION,
      ease: SCROLL_TOP_EASE,
      onUpdate: (latest) => window.scrollTo(0, latest),
      onComplete: () => {
        animationRef.current = null;
      },
    });
  };

  return (
    <motion.div
      className="fixed right-5 bottom-5 z-40 sm:right-7 sm:bottom-7"
      initial={false}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden={!isVisible}
    >
      <Button
        type="button"
        size="lg"
        onClick={handleScrollTop}
        disabled={!isVisible}
        aria-label="맨 위로 이동"
        className={cn(
          "h-11 rounded-full px-3.5 font-black shadow-xl backdrop-blur-md",
          "border-border/70 bg-background/70 text-foreground border",
          "hover:bg-background/90 hover:text-brand",
          "dark:bg-background/65 dark:hover:bg-background/85",
          "transition-all duration-200 disabled:pointer-events-none",
        )}
      >
        <ArrowUp className="size-4" aria-hidden />
        <span className="hidden text-xs sm:inline">TOP</span>
      </Button>
    </motion.div>
  );
}
