"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
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
    <Button
      size="icon-lg"
      variant={"outline"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="cursor-pointer hover:opacity-60"
    >
      {isDark ? (
        <Sun
          className="h-7 w-7 text-[#FFB800] transition-all"
          fill="#FFB800" // 테두리뿐만 아니라 안쪽도 고급지게 채움
        />
      ) : (
        <Moon className="h-7 w-7 text-[#FFB800] transition-all" fill="#FFB800" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
