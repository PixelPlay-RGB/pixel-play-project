"use client";
// 채팅방 Realtime Presence 구독과 typing 상태 전송을 관리하는 훅

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CHAT_ROOM_PRESENCE_REFRESH_INTERVAL_MS,
  CHAT_ROOM_TYPING_IDLE_TIMEOUT_MS,
  CHAT_ROOM_TYPING_REFRESH_INTERVAL_MS,
} from "@/constants/chat-room-presence";
import { createClient } from "@/lib/supabase/client";
import type {
  ChatRoomMemberPresenceMap,
  ChatRoomPresencePayload,
  ChatRoomPresenceState,
} from "@/types/chat-room-presence";
import type { DBUser } from "@/types/user";
import {
  createChatRoomPresenceChannelName,
  createChatRoomPresencePayload,
  resolveChatRoomMemberPresenceMap,
} from "@/utils/chat-room-presence";

type ChatRoomPresenceChannel = ReturnType<ReturnType<typeof createClient>["channel"]>;

interface Params {
  roomId: string;
  currentUser: Pick<DBUser, "id" | "nickname" | "photo_url"> | null;
  enabled: boolean;
}

export function useChatRoomPresence({ roomId, currentUser, enabled }: Params) {
  const supabase = useMemo(() => createClient(), []);
  const [memberPresence, setMemberPresence] = useState<ChatRoomMemberPresenceMap>({});
  const channelRef = useRef<ChatRoomPresenceChannel | null>(null);
  const presenceStateRef = useRef<ChatRoomPresenceState>({});
  const onlineAtRef = useRef(new Date().toISOString());
  const typingRef = useRef(false);
  const lastTypingSentAtRef = useRef(0);
  const lastTypingStoppedAtRef = useRef(0);
  const typingIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingRefreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshMemberPresence = useCallback(() => {
    setMemberPresence(resolveChatRoomMemberPresenceMap(presenceStateRef.current, Date.now()));
  }, []);

  const clearTypingIdleTimer = useCallback(() => {
    if (!typingIdleTimerRef.current) {
      return;
    }

    clearTimeout(typingIdleTimerRef.current);
    typingIdleTimerRef.current = null;
  }, []);

  const clearTypingRefreshTimer = useCallback(() => {
    if (!typingRefreshTimerRef.current) {
      return;
    }

    clearInterval(typingRefreshTimerRef.current);
    typingRefreshTimerRef.current = null;
  }, []);

  const publishPresence = useCallback(
    async (isTyping: boolean) => {
      if (!enabled || !roomId || !currentUser || !channelRef.current) {
        return;
      }

      typingRef.current = isTyping;
      const nowIso = new Date().toISOString();

      await channelRef.current.track(
        createChatRoomPresencePayload({
          roomId,
          userId: currentUser.id,
          nickname: currentUser.nickname,
          photoUrl: currentUser.photo_url,
          isTyping,
          onlineAt: onlineAtRef.current,
          nowIso,
        }),
      );
    },
    [currentUser, enabled, roomId],
  );

  const startTypingRefreshTimer = useCallback(() => {
    if (typingRefreshTimerRef.current) {
      return;
    }

    typingRefreshTimerRef.current = setInterval(() => {
      if (!typingRef.current) {
        return;
      }

      void publishPresence(true);
    }, CHAT_ROOM_TYPING_REFRESH_INTERVAL_MS);
  }, [publishPresence]);

  const setTyping = useCallback(
    (isTyping: boolean) => {
      clearTypingIdleTimer();

      if (!isTyping) {
        clearTypingRefreshTimer();

        const nowMs = Date.now();
        const shouldPublishTypingStop =
          typingRef.current ||
          nowMs - lastTypingStoppedAtRef.current >= CHAT_ROOM_TYPING_REFRESH_INTERVAL_MS;

        if (shouldPublishTypingStop) {
          lastTypingStoppedAtRef.current = nowMs;
          lastTypingSentAtRef.current = 0;
          void publishPresence(false);
        }

        return;
      }

      const nowMs = Date.now();
      const shouldRefreshTyping =
        !typingRef.current ||
        nowMs - lastTypingSentAtRef.current >= CHAT_ROOM_TYPING_REFRESH_INTERVAL_MS;

      if (shouldRefreshTyping) {
        lastTypingSentAtRef.current = nowMs;
        lastTypingStoppedAtRef.current = 0;
        void publishPresence(true);
      }

      startTypingRefreshTimer();

      typingIdleTimerRef.current = setTimeout(() => {
        lastTypingSentAtRef.current = 0;
        clearTypingRefreshTimer();
        void publishPresence(false);
      }, CHAT_ROOM_TYPING_IDLE_TIMEOUT_MS);
    },
    [clearTypingIdleTimer, clearTypingRefreshTimer, publishPresence, startTypingRefreshTimer],
  );

  useEffect(() => {
    if (!enabled || !roomId || !currentUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMemberPresence({});
      presenceStateRef.current = {};
      return;
    }

    const clientKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(createChatRoomPresenceChannelName(roomId), {
      config: {
        presence: {
          key: `${currentUser.id}-${clientKey}`,
        },
      },
    });

    onlineAtRef.current = new Date().toISOString();
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        presenceStateRef.current = channel.presenceState<ChatRoomPresencePayload>();
        refreshMemberPresence();
      })
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          return;
        }

        void publishPresence(false);
      });

    const refreshInterval = window.setInterval(
      refreshMemberPresence,
      CHAT_ROOM_PRESENCE_REFRESH_INTERVAL_MS,
    );

    return () => {
      clearTypingIdleTimer();
      clearTypingRefreshTimer();
      window.clearInterval(refreshInterval);
      typingRef.current = false;
      lastTypingSentAtRef.current = 0;
      lastTypingStoppedAtRef.current = 0;
      presenceStateRef.current = {};
      setMemberPresence({});

      if (channelRef.current === channel) {
        channelRef.current = null;
      }

      void channel.untrack().finally(() => {
        void channel.unsubscribe();
      });
    };
  }, [
    clearTypingIdleTimer,
    clearTypingRefreshTimer,
    currentUser,
    enabled,
    publishPresence,
    refreshMemberPresence,
    roomId,
    supabase,
  ]);

  return {
    memberPresence,
    setTyping,
  };
}
