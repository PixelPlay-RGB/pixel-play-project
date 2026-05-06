import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          페이지를 찾을 수 없습니다.
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          아직 준비되지 않은 페이지이거나 이동할 수 없는 주소입니다.
        </p>
      </div>
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "bg-brand px-6 py-2 font-bold text-white hover:bg-brand/90 hover:text-white",
        )}
      >
        채팅방 목록으로 돌아가기
      </Link>
    </div>
  );
}
