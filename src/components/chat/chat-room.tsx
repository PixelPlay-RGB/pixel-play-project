"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { toast } from "sonner";

import { ERROR_MESSAGES } from "@/constants/errors";
import useMessages from "@/hooks/use-messages";
import { useUser } from "@/hooks/use-profile";
import { useRoom } from "@/hooks/use-room";
import { useRoomMembers } from "@/hooks/use-room-members";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/spinner";

import { MemberList } from "./member-list";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";

interface Props {
  roomId: string;
}

export function ChatRoom({ roomId }: Props) {
  const supabase = createClient();
  const { data: profile, isPending: profilePending } = useUser();

  const {
    messages,
    hasMorePrevious,
    isLoadingPrevious,
    loadPrevious,
    isLoadingInitial,
  } = useMessages(roomId);

  const [draft, setDraft] = useState("");
  const loadPreviousLockRef = useRef(false);
  const sendMessageLockRef = useRef(false);

  const {
    data: room,
    error: roomError,
    isPending: roomPending,
    isFetched: roomFetched,
  } = useRoom(roomId);

  const { data: members = [] } = useRoomMembers(roomId);

  const formattedParticipants = useMemo(
    () => members.length.toLocaleString("ko-KR"),
    [members.length],
  );

  if (profilePending) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    );
  }

  const currentUserId = profile?.id ?? "";

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (
      !trimmed ||
      sendMessageLockRef.current ||
      !currentUserId ||
      !roomId
    ) {
      return;
    }

    sendMessageLockRef.current = true;

    const { error } = await supabase.from("message").insert({
      chat_room_id: roomId,
      user_id: currentUserId,
      content: trimmed,
    });

    if (error) {
      console.error(error);
      const errorConfig =
        ERROR_MESSAGES[error.code] || ERROR_MESSAGES.DEFAULT;
      toast.error(errorConfig.title, {
        description: errorConfig.description,
      });
      sendMessageLockRef.current = false;
      return;
    }

    setDraft("");
    sendMessageLockRef.current = false;
  };

  const handleLoadPrevious = () => {
    if (loadPreviousLockRef.current || isLoadingPrevious || !hasMorePrevious) {
      return false;
    }

    loadPreviousLockRef.current = true;
    void loadPrevious().finally(() => {
      loadPreviousLockRef.current = false;
    });

    return true;
  };

  const roomMissing =
    !!roomId && roomFetched && (roomError != null || room == null);

  if (!roomId) {
    return (
      <div className="dark flex h-full min-h-0 flex-col items-center justify-center gap-3 bg-zinc-950 px-4 text-center text-zinc-200">
        <p className="text-sm">방 정보가 없습니다.</p>
        <Link href="/" className="text-sm underline">
          처음으로
        </Link>
      </div>
    );
  }

  if (roomMissing) {
    return (
      <div className="dark flex h-full min-h-0 flex-col items-center justify-center gap-3 bg-zinc-950 px-4 text-center text-zinc-200">
        <p className="text-sm">
          존재하지 않는 채팅방이거나 불러올 수 없습니다.
        </p>
        <Link href="/" className="text-sm underline">
          처음으로
        </Link>
      </div>
    );
  }

  const inputLocked = profilePending || !currentUserId;

  return (
    <div className="dark flex h-full min-h-0 w-full flex-col overflow-hidden bg-zinc-950 text-foreground md:flex-row">
      <MemberList roomId={roomId} />

      <aside className="flex min-h-0 flex-1 flex-col border-white/10 bg-background md:w-[min(100%,380px)] md:shrink-0 md:border-l">
        <header className="shrink-0 border-b border-border px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="line-clamp-2 text-sm font-semibold leading-tight">
              {roomPending ? "불러오는 중…" : (room?.title ?? "채팅방")}
            </h1>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formattedParticipants}명
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
            {room?.description ?? ""}
          </p>
        </header>

        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          hasMorePrevious={hasMorePrevious}
          isLoadingPrevious={isLoadingPrevious || isLoadingInitial}
          onReachTop={handleLoadPrevious}
        />

        <MessageInput
          draft={draft}
          onDraftChange={setDraft}
          onSend={handleSend}
          disabled={inputLocked}
          disabledHint={
            profilePending
              ? "프로필을 불러오는 중입니다."
              : "로그인 프로필을 확인할 수 없습니다."
          }
        />
      </aside>
    </div>
  );
}
