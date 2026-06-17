"use client";
// 닉네임 팝업의 팔로우 버튼용 — "현재 로그인 시청자가 대상 채널을 팔로우 중인지" 조회.
// viewer_creator_relation 은 RLS(viewer_id = auth.uid())로 본인 관계를 직접 select 할 수 있어
// RPC 없이 브라우저 client 로 확인한다. 팝업이 열렸을 때만(enabled) 조회한다.
// 언팔로우는 행 삭제가 아니라 followed_at = null 이라, "팔로우 중"은 행 존재가 아니라 followed_at 비어있지 않음으로 판정한다.

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/common/query-keys";
import { createClient } from "@/lib/supabase/client";

export function useViewerFollowStatus(
  viewerId: string | null,
  targetUserId: string | null,
  enabled: boolean,
) {
  const supabase = useMemo(() => createClient(), []);

  const query = useQuery<boolean>({
    queryKey: QUERY_KEYS.live.viewerFollowStatus(viewerId ?? undefined, targetUserId ?? undefined),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("viewer_creator_relation")
        // enabled 가 viewerId/targetUserId 존재를 보장한다.
        .select("followed_at")
        .eq("viewer_id", viewerId as string)
        .eq("creator_id", targetUserId as string)
        .maybeSingle();

      if (error) {
        console.error("팔로우 상태 조회 실패", error);
        throw error;
      }

      return data?.followed_at != null;
    },
    enabled: enabled && Boolean(viewerId) && Boolean(targetUserId),
    staleTime: 1000 * 30,
  });

  return {
    isFollowing: query.data ?? false,
    isLoading: query.isLoading,
  };
}
