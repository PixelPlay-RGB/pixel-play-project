// 404 Not Found 화면을 렌더링합니다.
import { buttonVariants } from "@/components/ui/button";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { cn } from "@/lib/utils";
import { getAppMessage } from "@/utils/common/app-message";
import Link from "next/link";

export default function NotFound() {
  const message = getAppMessage(APP_MESSAGE_CODE.error.common.notFoundPage);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex flex-col gap-2">
        <h2 className="text-foreground text-2xl font-bold">{message.title}</h2>
        <p className="text-muted-foreground text-sm">{message.description}</p>
      </div>
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "bg-brand hover:bg-brand/90 text-brand-foreground hover:text-brand-foreground px-6 py-2 font-bold",
        )}
      >
        채팅방 목록으로 돌아가기
      </Link>
    </div>
  );
}
