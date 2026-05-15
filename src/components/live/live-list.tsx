import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LiveList() {
  return (
    <div className="flex min-h-105 w-full flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-5 px-4 text-center">
        <div className="relative">
          <div
            className={cn(
              "flex h-20 w-20 items-center justify-center rounded-2xl ring-1",
              "bg-live/10 ring-live/20 dark:bg-live/15",
            )}
          >
            <Radio className="text-live h-9 w-9" />
          </div>
          <span className="border-live/20 absolute -inset-2 animate-ping rounded-3xl border opacity-40" />
          <span className="border-live/10 absolute -inset-4 animate-ping rounded-3xl border opacity-20 delay-300" />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5",
                "bg-live text-xs font-black tracking-widest text-white shadow-sm",
              )}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/80" />
              LIVE
            </span>
          </div>
          <h2 className="text-foreground text-xl font-bold">현재 라이브 기능은 준비 중입니다.</h2>
          <p className="text-muted-foreground max-w-70 text-sm leading-relaxed">
            곧 라이브 방송 기능이 시작됩니다. <br className="hidden sm:block" />
            조금만 기다려주세요!
          </p>
        </div>
      </div>
    </div>
  );
}
