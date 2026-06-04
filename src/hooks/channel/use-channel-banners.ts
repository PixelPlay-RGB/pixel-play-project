"use client";
// 채널 배너 목록 상태 + 추가/삭제/순서변경(즉시 반영) mutation.

import {
  addChannelBannerAction,
  deleteChannelBannerAction,
  reorderChannelBannersAction,
} from "@/actions/channel/banner";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { CHANNEL_BANNER_MAX } from "@/lib/zod/channel-profile";
import type { ChannelBanner } from "@/types/channel/channel";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export function useChannelBanners(initialBanners: ChannelBanner[]) {
  const [banners, setBanners] = useState(initialBanners);

  const addMutation = useMutation({
    mutationFn: (formData: FormData) => addChannelBannerAction(formData),
    onSuccess: (result) => {
      if (!result.success || !result.data) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.channel.bannerSaveFailed);
        return;
      }
      setBanners(result.data);
      toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.channel.bannerSaved);
    },
    onError: (error) => {
      console.error("배너 추가 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.channel.bannerSaveFailed);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (bannerId: string) => deleteChannelBannerAction(bannerId),
    onSuccess: (result) => {
      if (!result.success || !result.data) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.channel.bannerDeleteFailed);
        return;
      }
      setBanners(result.data);
      toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.channel.bannerDeleted);
    },
    onError: (error) => {
      console.error("배너 삭제 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.channel.bannerDeleteFailed);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => reorderChannelBannersAction(ids),
    onSuccess: (result) => {
      if (!result.success || !result.data) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.channel.bannerSaveFailed);
        return;
      }
      setBanners(result.data);
    },
    onError: (error) => {
      console.error("배너 순서 변경 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.channel.bannerSaveFailed);
    },
  });

  // 드래그 중 낙관적으로 순서만 반영(서버 요청 X).
  const setOrder = (next: ChannelBanner[]) => {
    setBanners(next);
  };

  // 드래그 종료 시 최종 순서를 서버에 커밋(순서가 실제로 바뀐 경우만 호출).
  const commitOrder = (ids: string[]) => {
    if (reorderMutation.isPending) {
      return;
    }
    reorderMutation.mutate(ids);
  };

  return {
    banners,
    addBanner: addMutation.mutate,
    isAdding: addMutation.isPending,
    deleteBanner: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    setOrder,
    commitOrder,
    isReordering: reorderMutation.isPending,
    canAddMore: banners.length < CHANNEL_BANNER_MAX,
  };
}
