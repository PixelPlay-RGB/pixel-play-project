import { buttonVariants } from "@/components/ui/button";
import { APP_MESSAGE_CODE } from "@/constants/app-message";
import { cn } from "@/lib/utils";
import { getAppMessage } from "@/utils/app-message";
import Link from "next/link";

export default function NotFound() {
  const message = getAppMessage(APP_MESSAGE_CODE.error.common.notFoundPage);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{message.title}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{message.description}</p>
      </div>
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "bg-brand hover:bg-brand/90 px-6 py-2 font-bold text-white hover:text-white",
        )}
      >
        채팅방 목록으로 돌아가기
      </Link>
    </div>
  );
}
