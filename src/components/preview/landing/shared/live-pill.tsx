// 랜딩 프리뷰의 LIVE 상태 배지를 렌더링합니다.
import { LANDING_LIVE_LABEL } from "@/constants/preview/landing-preview";
import { cn } from "@/lib/utils";

export function LivePill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "bg-live text-xs font-black tracking-wider text-white uppercase",
        className,
      )}
    >
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-white" />
      </span>
      {LANDING_LIVE_LABEL}
    </span>
  );
}
