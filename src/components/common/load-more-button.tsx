// 목록의 더보기 버튼을 일관된 형태로 렌더링합니다.

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2 } from "lucide-react";

const LOAD_MORE_ACCENT_CLASS = {
  brand: "hover:border-brand/40 hover:text-brand",
  live: "hover:border-live/50 hover:text-live",
} as const;

interface LoadMoreButtonProps {
  isLoading: boolean;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  accent?: keyof typeof LOAD_MORE_ACCENT_CLASS;
}

export default function LoadMoreButton({
  isLoading,
  onClick,
  disabled,
  label = "더보기",
  accent = "brand",
}: LoadMoreButtonProps) {
  return (
    <div className="flex items-center gap-4 pt-1">
      <Separator className="flex-1" />
      <Button
        type="button"
        variant="secondary"
        onClick={onClick}
        disabled={disabled ?? isLoading}
        className={cn(
          "h-9 rounded-full border px-4 text-xs font-bold",
          "border-border bg-background text-muted-foreground shadow-sm",
          LOAD_MORE_ACCENT_CLASS[accent],
        )}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
        {label}
      </Button>
      <Separator className="flex-1" />
    </div>
  );
}
