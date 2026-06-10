"use client";
// 채널 후원 설정 폼 상태와 저장 mutation을 관리합니다.

import { updateChannelDonationSettingsAction } from "@/actions/channel/donation";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import {
  channelDonationSettingsSchema,
  type ChannelDonationSettingsInput,
} from "@/lib/zod/channel-donation";
import type { DonationSettings } from "@/types/channel/donation";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function useChannelDonationSettingsForm(initialSettings: DonationSettings) {
  const [settings, setSettings] = useState(initialSettings);
  const form = useForm<ChannelDonationSettingsInput>({
    resolver: zodResolver(channelDonationSettingsSchema),
    mode: "onChange",
    defaultValues: initialSettings,
  });

  const mutation = useMutation({
    mutationFn: updateChannelDonationSettingsAction,
    onSuccess: (result) => {
      if (!result.success || !result.data) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.channel.donationSettingsSaveFailed);
        return;
      }

      setSettings(result.data.settings);
      form.reset(result.data.settings);
      toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.channel.donationSettingsSaved);
    },
    onError: (error) => {
      console.error("채널 후원 설정 저장 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.channel.donationSettingsSaveFailed);
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    mutation.mutate(values);
  });

  return {
    form,
    settings,
    handleSubmit,
    isSaving: mutation.isPending || form.formState.isSubmitting,
  };
}
