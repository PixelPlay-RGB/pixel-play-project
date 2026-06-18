"use client";
// 팔로우/언팔로우 토글의 공용 코어 — 서버 액션 디스패치와 토스트 코드 분기를 한곳에 모은다.
// 시청 화면(use-follow-creator)·채널 헤더(use-toggle-channel-following)·캐시 옵티미스틱
// (use-optimistic-follow-toggle)이 모두 같은 액션 호출과 같은 도메인 토스트 코드를 쓰므로,
// 호출부의 토스트 정책(성공 시 code 우선 여부, 실패 fallback 등)은 각 훅이 결정하도록 분리한다.

import { followCreatorAction, unfollowCreatorAction } from "@/actions/following/following";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";

// nextFollowing=true면 팔로우, false면 언팔로우 서버 액션을 호출한다.
export function runFollowToggleAction(creatorId: string, nextFollowing: boolean) {
  return nextFollowing ? followCreatorAction({ creatorId }) : unfollowCreatorAction({ creatorId });
}

// 토글 결과의 성공 토스트 코드(팔로우/언팔로우 분기).
export function followToggleSuccessCode(nextFollowing: boolean) {
  return nextFollowing
    ? APP_MESSAGE_CODE.success.following.followed
    : APP_MESSAGE_CODE.success.following.unfollowed;
}

// 토글 실패 토스트 코드(팔로우/언팔로우 분기).
export function followToggleErrorCode(nextFollowing: boolean) {
  return nextFollowing
    ? APP_MESSAGE_CODE.error.following.failed
    : APP_MESSAGE_CODE.error.following.unfollowFailed;
}
