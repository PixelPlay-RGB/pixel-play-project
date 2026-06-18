"use client";
// 크리에이터 팔로우 토글 UI의 본인(own) 판정 + 진행 중(pending) 판정을 공용화합니다.
// 검색 결과 카드·아바타 팝오버·프로필 팝업이 동일하게 (현재 유저 == 대상)와
// (해당 mutation이 이 creatorId로 진행 중인지)를 손으로 재구성하던 로직을 한곳에 모읍니다.

import { useAuthStore } from "@/stores/auth";

interface CreatorFollowMutationState {
  isPending: boolean;
  variables?: { creatorId: string };
}

interface CreatorFollowState {
  // 대상 크리에이터가 현재 로그인 유저 본인인지(본인 채널은 토글 비활성).
  isOwnChannel: boolean;
  // 이 mutation이 "이 creatorId"로 진행 중인지(다른 카드의 토글로 인한 pending과 분리).
  isPending: boolean;
}

// mutation: useToggleCreatorFollowing / useToggleLiveSearchFollowing 등 variables.creatorId를 갖는 토글 mutation.
export function useCreatorFollowState(
  creatorId: string,
  mutation: CreatorFollowMutationState,
): CreatorFollowState {
  const currentUserId = useAuthStore((state) => state.user?.id);

  return {
    isOwnChannel: currentUserId === creatorId,
    isPending: mutation.isPending && mutation.variables?.creatorId === creatorId,
  };
}
