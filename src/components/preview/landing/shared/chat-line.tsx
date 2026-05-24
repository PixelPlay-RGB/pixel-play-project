// 랜딩 프리뷰의 축약 채팅 메시지 라인을 렌더링합니다.
import { cn } from "@/lib/utils";

export function ChatLine({
  name,
  nameClass,
  text,
  donation = false,
}: {
  name: string;
  nameClass: string;
  text: string;
  donation?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="from-brand to-live mt-0.5 size-4 shrink-0 rounded-full bg-linear-to-br" />
      {donation ? (
        <p
          className={cn(
            "border-live/40 rounded-lg border px-2.5 py-1.5",
            "from-live/20 to-brand/15 bg-linear-to-r",
            "text-xs leading-snug font-bold",
          )}
        >
          ♥ <span className={cn("font-black", nameClass)}>{name}</span> {text}
        </p>
      ) : (
        <p className="text-xs leading-snug font-medium">
          <span className={cn("mr-1.5 font-extrabold", nameClass)}>{name}</span>
          {text}
        </p>
      )}
    </div>
  );
}
