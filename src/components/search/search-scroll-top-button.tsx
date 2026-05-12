// 검색 결과 페이지에서 상단으로 이동하는 플로팅 버튼입니다.
"use client";

import { useEffect, useState } from "react";

import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function getScrollThreshold() {
  return Math.max(480, window.innerHeight * 0.75);
}

export default function SearchScrollTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > getScrollThreshold());
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      aria-label="검색 결과 상단으로 이동"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed right-4 bottom-6 z-40 rounded-full",
        "border-brand/30 bg-background/90 text-brand shadow-lg shadow-black/10 backdrop-blur",
        "hover:border-brand/50 hover:bg-brand/10 hover:text-brand",
        "sm:right-6 sm:bottom-8",
      )}
    >
      <ArrowUp className="h-4 w-4" />
    </Button>
  );
}
