"use client";

import { cn } from "@/lib/utils";
import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "rounded-lg p-2 transition-all duration-200",
        "hover:bg-accent cursor-pointer",
        "text-brand",
      )}
    >
      {isDark ? <SunMedium size={32} /> : <Moon size={32} />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
