// 라이브 검색의 빈 상태와 에러 상태를 렌더링합니다.
import { cn } from "@/lib/utils";
import { Radio, Search } from "lucide-react";

interface Props {
  message: string;
  title: string;
  tone?: "brand" | "live";
}

export default function LiveSearchEmptyState({ message, title, tone = "live" }: Props) {
  const Icon = tone === "live" ? Radio : Search;

  return (
    <div className="flex min-h-120 w-full items-center justify-center px-4 py-12 text-center">
      <div className="flex max-w-84 flex-col items-center">
        <div
          className={cn(
            "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ring-1",
            tone === "live"
              ? "bg-live/10 ring-live/20 dark:bg-live/15"
              : "bg-brand/10 ring-brand/20 dark:bg-brand/15",
          )}
        >
          <Icon className={cn("h-7 w-7", tone === "live" ? "text-live" : "text-brand")} />
        </div>
        <h2 className="text-foreground text-base font-bold">{title}</h2>
        <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
