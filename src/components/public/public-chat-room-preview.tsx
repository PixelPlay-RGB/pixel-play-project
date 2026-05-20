// 비로그인 사용자에게 채팅방 공유 preview를 제공합니다.
import Logo from "@/components/common/logo";
import { buttonVariants } from "@/components/ui/button";
import type { PublicChatRoomMetadata } from "@/types/public/public";
import { cn } from "@/lib/utils";
import { createPathWithNext } from "@/utils/common/redirect";
import { DoorOpen, MessageCircle } from "lucide-react";
import Link from "next/link";

interface Props {
  roomId: string;
  room: PublicChatRoomMetadata | null;
}

export default function PublicChatRoomPreview({ roomId, room }: Props) {
  const next = `/chat-room/${roomId}`;
  const title = room?.title ?? "채팅방을 찾을 수 없습니다.";
  const description =
    room?.description || "로그인하면 PixelPlay 채팅방에 참여하고 메시지를 확인할 수 있습니다.";

  return (
    <section className="h-app-content mx-auto flex w-full max-w-3xl flex-col px-5 py-10 sm:px-8 md:justify-center md:py-14">
      <div className="border-brand/15 bg-card/75 shadow-brand-panel flex flex-col gap-6 rounded-2xl border p-5 sm:p-8">
        <Logo className="text-foreground h-auto w-36" />
        <div className="flex flex-col gap-3">
          <div className="bg-brand/10 text-brand flex size-11 items-center justify-center rounded-xl">
            {room ? <MessageCircle className="size-5" /> : <DoorOpen className="size-5" />}
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-foreground text-2xl leading-tight font-black sm:text-3xl">
              {title}
            </h1>
            <p className="text-muted-foreground text-sm leading-6 sm:text-base">{description}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={createPathWithNext("/auth/login", next)}
            className={cn(buttonVariants(), "bg-brand hover:bg-brand/90 text-white")}
          >
            로그인 후 참여
          </Link>
          <Link
            href={createPathWithNext("/auth/signup", next)}
            className={cn(buttonVariants({ variant: "outline" }), "border-brand/30 text-brand")}
          >
            회원가입
          </Link>
        </div>
      </div>
    </section>
  );
}
