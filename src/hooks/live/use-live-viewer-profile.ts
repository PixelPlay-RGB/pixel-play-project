"use client";
// 닉네임 팝업용 시청자 프로필 조회 — 아바타·닉네임·이 채널 팔로우 시작일·현재 역할.
// get_live_viewer_profile 은 anon/authenticated grant 라 브라우저 client 로 직접 조회한다.
// 팝업이 열렸을 때만(enabled) 조회한다(채팅 닉네임마다 미리 받지 않는다).

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/common/query-keys";
import { createClient } from "@/lib/supabase/client";
import type { LiveViewerProfile } from "@/types/channel/moderation";
import { parseLiveViewerProfile } from "@/utils/channel/channel-moderation";

export function useLiveViewerProfile(
  creatorId: string,
  targetUserId: string | null,
  enabled: boolean,
) {
  const supabase = useMemo(() => createClient(), []);

  const query = useQuery<LiveViewerProfile | null>({
    queryKey: QUERY_KEYS.live.viewerProfile(creatorId, targetUserId ?? undefined),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_live_viewer_profile", {
        p_creator_id: creatorId,
        // enabled 가 targetUserId 존재를 보장한다.
        p_target_user_id: targetUserId as string,
      });

      if (error) {
        console.error("시청자 프로필 조회 실패", error);
        throw error;
      }

      return parseLiveViewerProfile(data);
    },
    enabled: enabled && Boolean(creatorId) && Boolean(targetUserId),
    staleTime: 1000 * 60,
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
