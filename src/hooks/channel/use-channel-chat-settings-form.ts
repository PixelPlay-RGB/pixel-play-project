"use client";
// 채널 채팅 설정 폼 상태와 저장 mutation을 관리합니다.

import { updateChannelChatSettingsAction } from "@/actions/channel/chat";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { channelChatSettingsSchema, type ChannelChatSettingsInput } from "@/lib/zod/channel-chat";
import type { ChannelChatSnapshot } from "@/types/channel/chat";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

export function useChannelChatSettingsForm(initialSnapshot: ChannelChatSnapshot) {
  const defaultValues = useMemo(() => toFormValues(initialSnapshot), [initialSnapshot]);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const form = useForm<ChannelChatSettingsInput>({
    resolver: zodResolver(channelChatSettingsSchema),
    mode: "onChange",
    defaultValues,
  });

  const mutation = useMutation({
    mutationFn: updateChannelChatSettingsAction,
    onSuccess: (result) => {
      if (!result.success || !result.data) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.channel.chatSettingsSaveFailed);
        return;
      }

      const nextValues = toFormValues(result.data);

      setSnapshot(result.data);
      form.reset(nextValues);
      toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.channel.chatSettingsSaved);
    },
    onError: (error) => {
      console.error("채널 채팅 설정 저장 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.channel.chatSettingsSaveFailed);
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    mutation.mutate(values);
  });

  return {
    form,
    snapshot,
    handleSubmit,
    isSaving: mutation.isPending || form.formState.isSubmitting,
  };
}

function toFormValues(snapshot: ChannelChatSnapshot): ChannelChatSettingsInput {
  return {
    chatScope: snapshot.chatScope,
    followerWaitSeconds: snapshot.followerWaitSeconds,
    slowModeEnabled: snapshot.slowModeEnabled,
    slowModeSeconds: snapshot.slowModeSeconds,
    linkBlocked: snapshot.linkBlocked,
    forbiddenWords: snapshot.forbiddenWords,
    chatRuleText: snapshot.chatRuleText,
  };
}
