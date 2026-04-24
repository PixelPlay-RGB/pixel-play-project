"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import type { Message, Room, RoomMember } from "@/types/chat";
import useMessages from "@/hooks/use-messages";
import { useProfile } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";

import { MemberList } from "./member-list";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";

interface Props {
  roomId: string;
}

interface RoomQueryRow {
  id: string;
  title: string;
  description: string | null;
  user_id: string;
  created_at: string;
}

interface RoomMemberQueryRow {
  room_id: string;
  user_id: string;
  joined_at: string;
  user: { nickname: string } | null;
}

export function ChatRoom({ roomId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const { data: profile, isPending: profilePending } = useProfile();
  const currentUserId = profile?.id ?? "";

  const {
    messages,
    displayNameByUserId,
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
  } = useQuery({
    queryKey: ["room", roomId],
    enabled: !!roomId,
    queryFn: async (): Promise<Room> => {
      const { data, error } = await supabase
        .from("room")
        .select("id, title, description, user_id, created_at")
        .eq("id", roomId)
        .single()
        .returns<RoomQueryRow>();

      if (error) throw error;

      return {
        id: data.id,
        title: data.title,
        description: data.description ?? "",
        createdBy: data.user_id,
        createdAt: data.created_at,
      };
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["room-members", roomId],
    enabled: !!roomId,
    queryFn: async (): Promise<RoomMember[]> => {
      const { data, error } = await supabase
        .from("room_member")
        .select("room_id, user_id, joined_at, user:user_id(nickname)")
        .eq("room_id", roomId)
        .order("joined_at", { ascending: true })
        .returns<RoomMemberQueryRow[]>();

      if (error) throw error;

      return (data ?? []).map((member) => ({
        id: `${member.room_id}-${member.user_id}`,
        userId: member.user_id,
        name:
          member.user?.nickname?.trim() ||
          member.user_id.slice(0, 8),
        joinedAt: member.joined_at,
      }));
    },
  });

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

    const next: Message = {
      id: `local-${crypto.randomUUID()}`,
      roomId,
      userId: currentUserId,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const { error } = await supabase.from("message").insert({
      room_id: next.roomId,
      user_id: next.userId,
      content: next.content,
      created_at: next.createdAt,
    });

    if (error) {
      console.error(error);
      if (error.code === "42501") {
        toast.error("메시지를 보낼 권한이 없어요", {
          description:
            "Supabase에서 message 테이블 RLS(INSERT 정책)를 확인해줘. 레포의 supabase/migrations SQL 실행도 필요할 수 있어.",
        });
      } else {
        toast.error("메시지 전송 실패", { description: error.message });
      }
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

  const formattedParticipants = useMemo(
    () => members.length.toLocaleString("ko-KR"),
    [members.length],
  );

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
      <MemberList members={members} />

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
          displayNameByUserId={displayNameByUserId}
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
