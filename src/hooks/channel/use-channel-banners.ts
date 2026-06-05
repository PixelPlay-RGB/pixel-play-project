"use client";
// 채널 배너 목록 상태. 추가/삭제는 즉시 반영, 순서변경은 드래그로 로컬 반영 후 "변경사항 저장"에서 커밋.

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

function orderKey(banners: ChannelBanner[]): string {
  return banners.map((banner) => banner.id).join("|");
}

export function useChannelBanners(initialBanners: ChannelBanner[]) {
  const [banners, setBanners] = useState(initialBanners);
  // 서버에 저장된 순서 기준. 드래그로 banners 순서가 이 기준과 달라지면 isOrderDirty가 된다.
  const [baselineKey, setBaselineKey] = useState(() => orderKey(initialBanners));

  // 순서커밋 응답: 목록·기준을 서버 순서로 완전 동기화(로컬 순서 == 저장 순서).
  const sync = (next: ChannelBanner[]) => {
    setBanners(next);
    setBaselineKey(orderKey(next));
  };

  // 추가/삭제 응답 머지: 미저장 드래그 순서를 보존한다.
  // 살아남은 항목은 현재 로컬(드래그) 순서를 유지하고, 서버에만 새로 생긴 항목은 뒤에 붙인다.
  // 기준(baseline)은 서버 저장 순서로 둬서, 미커밋 reorder가 있으면 isOrderDirty가 유지된다.
  const applyServerList = (serverList: ChannelBanner[]) => {
    setBanners((prev) => {
      const byId = new Map(serverList.map((banner) => [banner.id, banner]));
      const merged: ChannelBanner[] = [];
      for (const banner of prev) {
        const fresh = byId.get(banner.id);
        if (fresh) {
          merged.push(fresh);
          byId.delete(banner.id);
        }
      }
      for (const banner of serverList) {
        if (byId.has(banner.id)) {
          merged.push(banner);
        }
      }
      return merged;
    });
    setBaselineKey(orderKey(serverList));
  };

  const addMutation = useMutation({
    mutationFn: (formData: FormData) => addChannelBannerAction(formData),
    onSuccess: (result) => {
      if (!result.success || !result.data) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.channel.bannerSaveFailed);
        return;
      }
      applyServerList(result.data);
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
      applyServerList(result.data);
      toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.channel.bannerDeleted);
    },
    onError: (error) => {
      console.error("배너 삭제 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.channel.bannerDeleteFailed);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => reorderChannelBannersAction(ids),
  });

  // 드래그 중: 로컬 순서만 반영(서버 커밋 X).
  const setOrder = (next: ChannelBanner[]) => {
    setBanners(next);
  };

  // 저장된 순서로 되돌리기(취소).
  const resetOrder = () => {
    setBanners((prev) => {
      const order = baselineKey.split("|");
      return [...prev].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    });
  };

  const isOrderDirty = orderKey(banners) !== baselineKey;

  // "변경사항 저장"에서 호출: 현재 순서를 서버에 커밋. 성공 여부 반환.
  const commitOrder = async (): Promise<boolean> => {
    if (!isOrderDirty) {
      return true;
    }
    const result = await reorderMutation
      .mutateAsync(banners.map((banner) => banner.id))
      .catch(() => null);
    if (!result?.success || !result.data) {
      toastAppError(result?.code ?? APP_MESSAGE_CODE.error.channel.bannerSaveFailed);
      return false;
    }
    sync(result.data);
    return true;
  };

  return {
    banners,
    addBanner: addMutation.mutate,
    isAdding: addMutation.isPending,
    deleteBanner: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    setOrder,
    resetOrder,
    isOrderDirty,
    commitOrder,
    isCommittingOrder: reorderMutation.isPending,
    canAddMore: banners.length < CHANNEL_BANNER_MAX,
  };
}

export type ChannelBannersController = ReturnType<typeof useChannelBanners>;
