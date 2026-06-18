"use client";
// 채널 매니저 목록 조회 + 추가/해제. get_channel_managers 는 authenticated grant + 내부 auth.uid()=creator
// 검증이라 브라우저 client 로 직접 조회하고, 추가/해제는 서버 액션(service_role RPC) 후 목록을 무효화한다.

import { useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { addChannelManagerAction, removeChannelManagerAction } from "@/actions/channel/moderation";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { createClient } from "@/lib/supabase/client";
import type { ChannelManagerItem } from "@/types/channel/moderation";
import { parseChannelManagers } from "@/utils/channel/channel-moderation";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

// listEnabled=false 면 매니저 목록 조회는 끄고 추가/해제 mutation 만 쓴다 — 닉네임 팝오버처럼
// 권한 없는 시청자가 마운트해도 get_channel_managers(크리에이터 본인 전용) 권한 에러가 나지 않게.
export function useChannelManagers(creatorId: string, options?: { listEnabled?: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const query = useQuery<ChannelManagerItem[]>({
    queryKey: QUERY_KEYS.channel.managers(creatorId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_channel_managers", {
        p_creator_id: creatorId,
      });

      if (error) {
        console.error("매니저 목록 조회 실패", error);
        throw error;
      }

      return parseChannelManagers(data);
    },
    enabled: Boolean(creatorId) && (options?.listEnabled ?? true),
  });

  const invalidateManagers = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.channel.managers(creatorId) });

  const addMutation = useMutation({
    mutationFn: (targetUserId: string) => addChannelManagerAction(targetUserId),
    onSuccess: async (result) => {
      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.channel.managerAddFailed);
        return;
      }
      await invalidateManagers();
      toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.channel.managerAdded);
    },
    onError: (error) => {
      console.error("매니저 추가 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.channel.managerAddFailed);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (targetUserId: string) => removeChannelManagerAction(targetUserId),
    onSuccess: async (result) => {
      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.channel.managerRemoveFailed);
        return;
      }
      await invalidateManagers();
      toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.channel.managerRemoved);
    },
    onError: (error) => {
      console.error("매니저 해제 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.channel.managerRemoveFailed);
    },
  });

  // 추가/해제 핸들러는 성공 여부(boolean)를 돌려줘 폼·다이얼로그가 입력 초기화/닫기를 결정한다.
  const addManager = async (targetUserId: string): Promise<boolean> => {
    const result = await addMutation.mutateAsync(targetUserId).catch(() => null);
    return Boolean(result?.success);
  };

  const removeManager = async (targetUserId: string): Promise<boolean> => {
    const result = await removeMutation.mutateAsync(targetUserId).catch(() => null);
    return Boolean(result?.success);
  };

  return {
    managers: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    addManager,
    isAdding: addMutation.isPending,
    removeManager,
    isRemoving: removeMutation.isPending,
  };
}
