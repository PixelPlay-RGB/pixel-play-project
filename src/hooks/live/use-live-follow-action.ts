"use client";
// 라이브 시청 화면의 팔로우 버튼 동작 — 비로그인 게이트 + 팔로우 토글을 한데 묶는다.
// 시청 화면(live-view)과 채팅 팝아웃(live-chat-popout)이 같은 배선을 쓰므로 공용화한다.
// 서버 액션 토글 자체는 use-follow-creator가 담당하고, 여기선 로그인 게이트만 얹는다.

import { useFollowCreator } from "@/hooks/live/use-follow-creator";

interface Params {
  creatorId: string;
  isFollowing: boolean;
  isLoggedIn: boolean;
  onFollowToggled: () => void;
  // 비로그인 상태에서 팔로우를 시도할 때 호출 — 화면마다 로그인 모달/이동이 달라 주입받는다.
  onUnauthenticated: () => void;
}

export function useLiveFollowAction({
  creatorId,
  isFollowing,
  isLoggedIn,
  onFollowToggled,
  onUnauthenticated,
}: Params) {
  const { toggleFollow, isPending } = useFollowCreator(creatorId, isFollowing, onFollowToggled);

  function handleFollow() {
    if (!isLoggedIn) {
      onUnauthenticated();
      return;
    }
    void toggleFollow();
  }

  return { handleFollow, isFollowPending: isPending };
}
