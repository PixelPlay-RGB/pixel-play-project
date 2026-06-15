"use client";
// 라이브 시청 페이지의 구독 버튼 로그인 게이트와 구독 액션을 묶습니다.

import { useSubscribeCreator } from "@/hooks/live/use-subscribe-creator";
import type { CreatorSubscriptionActionResult } from "@/types/live/live";

interface Params {
  creatorId: string;
  isSubscribed: boolean;
  isLoggedIn: boolean;
  onSubscribed: (result: CreatorSubscriptionActionResult) => void;
  onUnauthenticated: () => void;
}

export function useLiveSubscribeAction({
  creatorId,
  isSubscribed,
  isLoggedIn,
  onSubscribed,
  onUnauthenticated,
}: Params) {
  const { subscribe, isPending } = useSubscribeCreator(creatorId, isSubscribed, onSubscribed);

  function handleSubscribe() {
    if (!isLoggedIn) {
      onUnauthenticated();
      return;
    }

    void subscribe();
  }

  return { handleSubscribe, isSubscribePending: isPending };
}
