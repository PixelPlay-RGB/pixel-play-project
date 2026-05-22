// 비로그인 사용자에게 채팅방 공유 preview를 제공합니다.
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatRoomMetadata } from "@/types/preview/preview";
import { createPathWithNext } from "@/utils/common/redirect";
import {
  CHAT_ROOM_PREVIEW_DUMMY_MESSAGES,
  CHAT_ROOM_PREVIEW_LABELS,
} from "@/constants/preview/chat-room-preview";
import { DoorOpen, Lock, MessageCircle, Users } from "lucide-react";
import Link from "next/link";

interface Props {
  roomId: string;
  room: ChatRoomMetadata | null;
}

export default function ChatRoomPreview({ roomId, room }: Props) {
  const next = `/chat/room/${roomId}`;
  const title = room?.title ?? CHAT_ROOM_PREVIEW_LABELS.notFound;
  const description = room?.description || CHAT_ROOM_PREVIEW_LABELS.notFoundDescription;
  const isFound = !!room;

  return (
    <div
      className={cn(
        "h-app-content relative flex w-full items-center justify-center overflow-hidden",
        "bg-background",
      )}
    >
      {/* ── 배경 글로우 — 채팅은 민트 위주 ── */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="bg-brand/35 absolute -top-40 -left-40 size-96 rounded-full blur-3xl" />
        <div className="bg-brand/20 absolute -right-40 -bottom-40 size-80 rounded-full blur-3xl" />
        <div className="bg-brand/12 absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
      </div>

      {/* ── 배경 더미 채팅 (blur + fade) — 분위기만 느끼게 ── */}
      {isFound && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-0",
            "flex flex-col justify-center gap-3 px-8 py-12",
            "opacity-20 blur-sm select-none",
          )}
          aria-hidden
        >
          {CHAT_ROOM_PREVIEW_DUMMY_MESSAGES.map((msg, i) => (
            <div
              key={i}
              className={cn("flex max-w-xs gap-2", msg.mine && "ml-auto flex-row-reverse")}
            >
              {!msg.mine && <span className="bg-brand/70 mt-0.5 size-5 shrink-0 rounded-full" />}
              <div
                className={cn(
                  "rounded-2xl px-3 py-1.5 text-xs font-semibold",
                  msg.mine ? "bg-brand text-brand-foreground" : "bg-muted text-foreground",
                )}
              >
                {!msg.mine && (
                  <span className={cn("mr-1.5 font-black", msg.color)}>{msg.name}</span>
                )}
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 메인 카드 ── */}
      <div className={cn("relative z-10 mx-auto w-full max-w-md px-4 sm:max-w-lg sm:px-6")}>
        <div
          className={cn(
            "flex flex-col gap-6 overflow-hidden rounded-2xl border p-6 shadow-xl sm:p-8",
            "border-brand/20 bg-background/75 shadow-brand/10 backdrop-blur-xl",
            "dark:border-brand/10",
          )}
        >
          {/* 방 정보 */}
          <div className="flex flex-col gap-4">
            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-2xl",
                isFound ? "bg-brand/15 text-brand" : "bg-muted text-muted-foreground",
              )}
            >
              {isFound ? <MessageCircle className="size-5" /> : <DoorOpen className="size-5" />}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <h1 className="flex-1 text-2xl leading-tight font-black tracking-tight sm:text-3xl">
                  {title}
                </h1>
                {isFound && (
                  <span
                    className={cn(
                      "mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full",
                      "bg-brand/12 text-brand px-2.5 py-1 text-xs font-bold",
                    )}
                  >
                    <Users className="size-3" />
                    {CHAT_ROOM_PREVIEW_LABELS.joinAvailable}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm leading-6 font-medium sm:text-base">
                {description}
              </p>
            </div>
          </div>

          {/* 로그인 유도 배너 */}
          {isFound && (
            <div
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3",
                "border-brand/20 bg-brand/8",
              )}
            >
              <Lock className="text-brand size-4 shrink-0" />
              <p className="text-muted-foreground text-xs font-semibold sm:text-sm">
                {CHAT_ROOM_PREVIEW_LABELS.loginBannerText}{" "}
                <span className="text-brand font-bold">
                  {CHAT_ROOM_PREVIEW_LABELS.loginBannerHighlight}
                </span>
                {CHAT_ROOM_PREVIEW_LABELS.loginBannerSuffix}
              </p>
            </div>
          )}

          {/* CTA 버튼 — Link > Button 패턴 */}
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Link href={createPathWithNext("/auth/login", next)} className="flex-1">
              <Button
                className={cn(
                  "h-10 w-full rounded-xl font-bold tracking-widest uppercase",
                  "bg-brand hover:bg-brand/85 text-white active:scale-95",
                  "shadow-brand/20 shadow-sm transition-all",
                )}
              >
                {CHAT_ROOM_PREVIEW_LABELS.loginCta}
              </Button>
            </Link>
            <Link href={createPathWithNext("/auth/signup", next)} className="flex-1">
              <Button
                variant="outline"
                className={cn(
                  "h-10 w-full rounded-xl font-semibold",
                  "border-border bg-background text-foreground hover:bg-muted",
                  "transition-all",
                )}
              >
                {CHAT_ROOM_PREVIEW_LABELS.signupCta}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
