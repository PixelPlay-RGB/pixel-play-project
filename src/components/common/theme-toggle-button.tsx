"use client";
// theme-toggle-button 컴포넌트를 제공합니다.

import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className={cn(
        "grid size-10 place-items-center rounded-md",
        "hover:bg-muted cursor-pointer",
        "text-foreground",
        "transition-all duration-200",
      )}
    >
      {isDark ? <Sun size={24} /> : <Moon size={24} />}
    </button>
  );
}
