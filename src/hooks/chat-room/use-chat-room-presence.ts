"use client";
// 채팅방 Realtime Presence 구독과 typing 상태 전송을 관리하는 훅

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CHAT_ROOM_TYPING_BROADCAST_EVENT,
  CHAT_ROOM_TYPING_IDLE_TIMEOUT_MS,
  CHAT_ROOM_TYPING_KEEPALIVE_INTERVAL_MS,
  CHAT_ROOM_TYPING_PRUNE_INTERVAL_MS,
  CHAT_ROOM_TYPING_REMOTE_TIMEOUT_MS,
  CHAT_ROOM_TYPING_STOP_DELAY_MS,
} from "@/constants/chat-room/chat-room-presence";
import { createClient } from "@/lib/supabase/client";
import type {
  ChatRoomMemberPresenceMap,
  ChatRoomPresencePayload,
  ChatRoomPresenceState,
  ChatRoomTypingBroadcastPayload,
  ChatRoomTypingMemberMap,
} from "@/types/chat-room/chat-room-presence";
import type { DBUser } from "@/types/profile/user";
import {
  createChatRoomPresenceChannelName,
  createChatRoomPresencePayload,
  createChatRoomPresenceRealtimeTopic,
  createChatRoomTypingBroadcastPayload,
  pruneChatRoomTypingMemberMap,
  resolveChatRoomMemberPresenceMap,
} from "@/utils/chat-room/chat-room-presence";

type ChatRoomPresenceChannel = ReturnType<ReturnType<typeof createClient>["channel"]>;

interface Params {
  roomId: string;
  currentUser: Pick<DBUser, "id" | "nickname" | "photo_url"> | null;
  enabled: boolean;
}

export function useChatRoomPresence({ roomId, currentUser, enabled }: Params) {
  const supabase = useMemo(() => createClient(), []);
  const currentUserId = currentUser?.id ?? null;
  const currentUserNickname = currentUser?.nickname ?? null;
  const currentUserPhotoUrl = currentUser?.photo_url ?? null;
  const [memberPresence, setMemberPresence] = useState<ChatRoomMemberPresenceMap>({});
  const channelRef = useRef<ChatRoomPresenceChannel | null>(null);
  const presenceStateRef = useRef<ChatRoomPresenceState>({});
  const typingMemberMapRef = useRef<ChatRoomTypingMemberMap>({});
  const onlineAtRef = useRef(new Date().toISOString());
  const typingRef = useRef(false);
  const typingIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingKeepaliveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingStopDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSubscribedRef = useRef(false);

  const refreshMemberPresence = useCallback(() => {
    setMemberPresence(
      resolveChatRoomMemberPresenceMap(
        presenceStateRef.current,
        Object.keys(typingMemberMapRef.current),
      ),
    );
  }, []);

  const clearTypingIdleTimer = useCallback(() => {
    if (!typingIdleTimerRef.current) {
      return;
    }

    clearTimeout(typingIdleTimerRef.current);
    typingIdleTimerRef.current = null;
  }, []);

  const clearTypingKeepaliveTimer = useCallback(() => {
    if (!typingKeepaliveTimerRef.current) {
      return;
    }

    clearInterval(typingKeepaliveTimerRef.current);
    typingKeepaliveTimerRef.current = null;
  }, []);

  const clearTypingStopDelayTimer = useCallback(() => {
    if (!typingStopDelayTimerRef.current) {
      return;
    }

    clearTimeout(typingStopDelayTimerRef.current);
    typingStopDelayTimerRef.current = null;
  }, []);

  const sendTypingBroadcast = useCallback(
    async (isTyping: boolean) => {
      if (
        !enabled ||
        !roomId ||
        !currentUserId ||
        !channelRef.current ||
        !isSubscribedRef.current
      ) {
        return;
      }

      const sendStatus = await channelRef.current.send({
        type: "broadcast",
        event: CHAT_ROOM_TYPING_BROADCAST_EVENT,
        payload: createChatRoomTypingBroadcastPayload({
          roomId,
          userId: currentUserId,
          isTyping,
          nowIso: new Date().toISOString(),
        }),
      });

      if (process.env.NODE_ENV === "development" && sendStatus !== "ok") {
        console.debug("[chat-room-presence] typing broadcast failed", {
          isTyping,
          sendStatus,
        });
      }
    },
    [currentUserId, enabled, roomId],
  );

  const stopTypingImmediately = useCallback(() => {
    clearTypingIdleTimer();
    clearTypingKeepaliveTimer();
    clearTypingStopDelayTimer();

    if (!typingRef.current) {
      return;
    }

    typingRef.current = false;

    if (currentUserId) {
      delete typingMemberMapRef.current[currentUserId];
      refreshMemberPresence();
    }

    void sendTypingBroadcast(false);
  }, [
    clearTypingIdleTimer,
    clearTypingKeepaliveTimer,
    clearTypingStopDelayTimer,
    currentUserId,
    refreshMemberPresence,
    sendTypingBroadcast,
  ]);

  const scheduleStopTyping = useCallback(() => {
    clearTypingIdleTimer();

    if (!typingRef.current || typingStopDelayTimerRef.current) {
      return;
    }

    typingStopDelayTimerRef.current = setTimeout(() => {
      typingStopDelayTimerRef.current = null;
      stopTypingImmediately();
    }, CHAT_ROOM_TYPING_STOP_DELAY_MS);
  }, [clearTypingIdleTimer, stopTypingImmediately]);

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!isTyping) {
        scheduleStopTyping();
        return;
      }

      if (!currentUserId) {
        return;
      }

      clearTypingStopDelayTimer();

      const nowMs = Date.now();
      const wasTyping = typingRef.current;

      typingRef.current = true;
      typingMemberMapRef.current[currentUserId] = nowMs + CHAT_ROOM_TYPING_REMOTE_TIMEOUT_MS;

      if (!wasTyping) {
        refreshMemberPresence();
        void sendTypingBroadcast(true);
      }

      clearTypingIdleTimer();
      typingIdleTimerRef.current = setTimeout(scheduleStopTyping, CHAT_ROOM_TYPING_IDLE_TIMEOUT_MS);

      if (!typingKeepaliveTimerRef.current) {
        typingKeepaliveTimerRef.current = setInterval(() => {
          if (!typingRef.current) {
            clearTypingKeepaliveTimer();
            return;
          }

          typingMemberMapRef.current[currentUserId] =
            Date.now() + CHAT_ROOM_TYPING_REMOTE_TIMEOUT_MS;
          void sendTypingBroadcast(true);
        }, CHAT_ROOM_TYPING_KEEPALIVE_INTERVAL_MS);
      }
    },
    [
      clearTypingIdleTimer,
      clearTypingKeepaliveTimer,
      clearTypingStopDelayTimer,
      currentUserId,
      refreshMemberPresence,
      scheduleStopTyping,
      sendTypingBroadcast,
    ],
  );

  const pruneTypingMembers = useCallback(() => {
    const nextTypingMemberMap = pruneChatRoomTypingMemberMap(
      typingMemberMapRef.current,
      Date.now(),
    );

    if (
      Object.keys(nextTypingMemberMap).length === Object.keys(typingMemberMapRef.current).length
    ) {
      return;
    }

    typingMemberMapRef.current = nextTypingMemberMap;
    refreshMemberPresence();
  }, [refreshMemberPresence]);

  const trackPresence = useCallback(async () => {
    if (
      !enabled ||
      !roomId ||
      !currentUserId ||
      !currentUserNickname ||
      !channelRef.current ||
      !isSubscribedRef.current
    ) {
      return;
    }

    const trackStatus = await channelRef.current.track(
      createChatRoomPresencePayload({
        roomId,
        userId: currentUserId,
        nickname: currentUserNickname,
        photoUrl: currentUserPhotoUrl,
        onlineAt: onlineAtRef.current,
      }),
    );

    if (process.env.NODE_ENV === "development" && trackStatus !== "ok") {
      console.debug("[chat-room-presence] presence track", {
        trackStatus,
      });
    }
  }, [currentUserId, currentUserNickname, currentUserPhotoUrl, enabled, roomId]);

  const handleTypingBroadcast = useCallback(
    ({ payload }: { payload: ChatRoomTypingBroadcastPayload }) => {
      if (payload.roomId !== roomId || payload.userId === currentUserId) {
        return;
      }

      if (payload.isTyping) {
        const wasTyping = payload.userId in typingMemberMapRef.current;

        typingMemberMapRef.current[payload.userId] =
          Date.now() + CHAT_ROOM_TYPING_REMOTE_TIMEOUT_MS;

        if (!wasTyping) {
          refreshMemberPresence();
        }
      } else {
        const wasTyping = payload.userId in typingMemberMapRef.current;

        delete typingMemberMapRef.current[payload.userId];

        if (wasTyping) {
          refreshMemberPresence();
        }
      }
    },
    [currentUserId, refreshMemberPresence, roomId],
  );

  useEffect(() => {
    if (!enabled || !roomId || !currentUserId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMemberPresence({});
      presenceStateRef.current = {};
      typingMemberMapRef.current = {};
      return;
    }

    let isActive = true;
    let channel: ChatRoomPresenceChannel | null = null;
    const channelName = createChatRoomPresenceChannelName(roomId);
    const realtimeTopic = createChatRoomPresenceRealtimeTopic(roomId);
    const clientKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    void (async () => {
      const staleChannels = supabase
        .getChannels()
        .filter((existingChannel) => existingChannel.topic === realtimeTopic);

      await Promise.all(staleChannels.map((staleChannel) => supabase.removeChannel(staleChannel)));

      if (!isActive) {
        return;
      }

      channel = supabase.channel(channelName, {
        config: {
          presence: {
            key: `${currentUserId}-${clientKey}`,
          },
        },
      });

      onlineAtRef.current = new Date().toISOString();
      channelRef.current = channel;

      channel
        .on<ChatRoomTypingBroadcastPayload>(
          "broadcast",
          { event: CHAT_ROOM_TYPING_BROADCAST_EVENT },
          handleTypingBroadcast,
        )
        .on("presence", { event: "sync" }, () => {
          if (!channel) {
            return;
          }

          presenceStateRef.current = channel.presenceState<ChatRoomPresencePayload>();
          refreshMemberPresence();
        })
        .subscribe((status) => {
          if (status !== "SUBSCRIBED") {
            return;
          }

          isSubscribedRef.current = true;
          void trackPresence();
        });
    })();

    const pruneInterval = setInterval(pruneTypingMembers, CHAT_ROOM_TYPING_PRUNE_INTERVAL_MS);

    return () => {
      isActive = false;
      clearTypingIdleTimer();
      clearTypingKeepaliveTimer();
      clearTypingStopDelayTimer();
      clearInterval(pruneInterval);

      if (typingRef.current) {
        typingRef.current = false;
        void sendTypingBroadcast(false);
      }

      typingRef.current = false;
      isSubscribedRef.current = false;
      presenceStateRef.current = {};
      typingMemberMapRef.current = {};
      setMemberPresence({});

      if (!channel) {
        return;
      }

      if (channelRef.current === channel) {
        channelRef.current = null;
      }

      void supabase.removeChannel(channel);
    };
  }, [
    clearTypingIdleTimer,
    clearTypingKeepaliveTimer,
    clearTypingStopDelayTimer,
    currentUserId,
    enabled,
    handleTypingBroadcast,
    pruneTypingMembers,
    refreshMemberPresence,
    roomId,
    sendTypingBroadcast,
    supabase,
    trackPresence,
  ]);

  return {
    memberPresence,
    setTyping,
  };
}
