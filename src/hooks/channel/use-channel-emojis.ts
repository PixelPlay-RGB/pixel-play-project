"use client";
// 채널 이모지 목록 상태. 추가/수정/삭제는 즉시 반영, 순서변경은 드래그 종료 시 자동 커밋(배너 패턴 + 수정).

import {
  addChannelEmojiAction,
  deleteChannelEmojiAction,
  reorderChannelEmojisAction,
  updateChannelEmojiAction,
} from "@/actions/channel/channel-emoji";
import { CHANNEL_EMOJI_MAX } from "@/constants/channel/channel-emoji";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { ChannelEmoji } from "@/types/channel/channel-emoji";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

function orderKey(emojis: ChannelEmoji[]): string {
  return emojis.map((emoji) => emoji.id).join("|");
}

export function useChannelEmojis(initialEmojis: ChannelEmoji[]) {
  const [emojis, setEmojis] = useState(initialEmojis);
  // 서버에 저장된 순서 기준. 드래그로 emojis 순서가 이 기준과 달라지면 커밋 대상이 된다.
  const [baselineKey, setBaselineKey] = useState(() => orderKey(initialEmojis));

  // 순서 커밋 응답: 목록·기준을 서버 순서로 완전 동기화.
  const sync = (next: ChannelEmoji[]) => {
    setEmojis(next);
    setBaselineKey(orderKey(next));
  };

  // 추가/수정/삭제 응답 머지: 살아남은 항목은 현재 로컬 순서를 유지하고 새 항목만 뒤에 붙인다.
  const applyServerList = (serverList: ChannelEmoji[]) => {
    setEmojis((prev) => {
      const byId = new Map(serverList.map((emoji) => [emoji.id, emoji]));
      const merged: ChannelEmoji[] = [];
      for (const emoji of prev) {
        const fresh = byId.get(emoji.id);
        if (fresh) {
          merged.push(fresh);
          byId.delete(emoji.id);
        }
      }
      for (const emoji of serverList) {
        if (byId.has(emoji.id)) {
          merged.push(emoji);
        }
      }
      return merged;
    });
    setBaselineKey(orderKey(serverList));
  };

  const addMutation = useMutation({
    mutationFn: (formData: FormData) => addChannelEmojiAction(formData),
    onSuccess: (result) => {
      if (!result.success || !result.data) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.channel.emojiSaveFailed);
        return;
      }
      applyServerList(result.data);
      toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.channel.emojiSaved);
    },
    onError: (error) => {
      console.error("이모지 추가 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.channel.emojiSaveFailed);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (formData: FormData) => updateChannelEmojiAction(formData),
    onSuccess: (result) => {
      if (!result.success || !result.data) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.channel.emojiSaveFailed);
        return;
      }
      applyServerList(result.data);
      toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.channel.emojiUpdated);
    },
    onError: (error) => {
      console.error("이모지 수정 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.channel.emojiSaveFailed);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (emojiId: string) => deleteChannelEmojiAction(emojiId),
    onSuccess: (result) => {
      if (!result.success || !result.data) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.channel.emojiDeleteFailed);
        return;
      }
      applyServerList(result.data);
      toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.channel.emojiDeleted);
    },
    onError: (error) => {
      console.error("이모지 삭제 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.channel.emojiDeleteFailed);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => reorderChannelEmojisAction(ids),
  });

  // 드래그 중: 로컬 순서만 반영(서버 커밋 X).
  const setOrder = (next: ChannelEmoji[]) => {
    setEmojis(next);
  };

  // 저장된 순서로 되돌리기(커밋 실패 시).
  const resetOrder = () => {
    setEmojis((prev) => {
      const order = baselineKey.split("|");
      return [...prev].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    });
  };

  // 드래그 종료 시 호출: 현재 순서를 서버에 커밋(자동 저장). 실패하면 저장 순서로 되돌린다.
  const commitOrder = async (): Promise<void> => {
    if (orderKey(emojis) === baselineKey) {
      return;
    }
    const result = await reorderMutation
      .mutateAsync(emojis.map((emoji) => emoji.id))
      .catch(() => null);
    if (!result?.success || !result.data) {
      toastAppError(result?.code ?? APP_MESSAGE_CODE.error.channel.emojiSaveFailed);
      resetOrder();
      return;
    }
    sync(result.data);
  };

  return {
    emojis,
    addEmoji: addMutation.mutate,
    isAdding: addMutation.isPending,
    updateEmoji: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteEmoji: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    setOrder,
    commitOrder,
    isCommittingOrder: reorderMutation.isPending,
    canAddMore: emojis.length < CHANNEL_EMOJI_MAX,
  };
}
