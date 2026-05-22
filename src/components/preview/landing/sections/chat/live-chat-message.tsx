// 랜딩 프리뷰 채팅 메시지를 렌더링합니다.
import { cn } from "@/lib/utils";

export function LiveChatMessage({
  name,
  nameClass,
  text,
}: {
  name: string;
  nameClass: string;
  text: string;
}) {
  return (
    <p className="text-foreground text-xs leading-relaxed font-semibold">
      <span className={cn("mr-1.5 font-black", nameClass)}>{name}</span>
      {text}
    </p>
  );
}
