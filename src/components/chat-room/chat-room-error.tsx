// 채팅방 상세 화면의 진입 오류 상태를 표시하는 컴포넌트

import Link from "next/link";

import type { AppMessageCode } from "@/constants/app-message-code";
import { cn } from "@/lib/utils";
import { getAppMessage } from "@/utils/app-message";

interface Props {
  code: AppMessageCode;
}

export function ChatRoomError({ code }: Props) {
  const message = getAppMessage(code);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col items-center justify-center gap-3 px-4 text-center",
        "bg-background text-foreground",
      )}
    >
      <p className="text-sm">{message.title}</p>
      <Link href="/" className="text-sm underline">
        처음으로
      </Link>
    </div>
  );
}
