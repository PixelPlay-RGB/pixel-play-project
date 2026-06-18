"use client";
// 채널 시청자 제재 이력 조회(스튜디오 페이지·라이브 유저관리 Dialog 공용).
// get_channel_viewer_bans 는 authenticated grant + 내부 auth.uid()=크리에이터/매니저 검증이라
// 브라우저 client 로 직접 조회한다. 같은 queryKey 를 공유해 한쪽에서 해제하면 다른 쪽도 자동 동기화된다.

import { useMemo } from "react";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { CHANNEL_VIEWER_BAN_PAGE_SIZE } from "@/constants/channel/moderation";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { createClient } from "@/lib/supabase/client";
import type { ChannelViewerBanList } from "@/types/channel/moderation";
import { parseChannelViewerBans } from "@/utils/channel/channel-moderation";

export function useChannelViewerBans(creatorId: string, page: number) {
  const supabase = useMemo(() => createClient(), []);

  const query = useQuery<ChannelViewerBanList>({
    queryKey: QUERY_KEYS.channel.viewerBans(creatorId, page),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_channel_viewer_bans", {
        p_creator_id: creatorId,
        p_limit: CHANNEL_VIEWER_BAN_PAGE_SIZE,
        p_offset: (page - 1) * CHANNEL_VIEWER_BAN_PAGE_SIZE,
        // 시청자 관리 목록은 현재 강퇴 중인 시청자만 보여준다(해제된 행은 관리 동작이 없어 제외).
        p_active_only: true,
      });

      if (error) {
        console.error("제재 이력 조회 실패", error);
        throw error;
      }

      return parseChannelViewerBans(data);
    },
    enabled: Boolean(creatorId),
    placeholderData: keepPreviousData,
  });

  const totalCount = query.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / CHANNEL_VIEWER_BAN_PAGE_SIZE));

  return {
    bans: query.data?.items ?? [],
    totalCount,
    totalPages,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    isPlaceholderData: query.isPlaceholderData,
  };
}
