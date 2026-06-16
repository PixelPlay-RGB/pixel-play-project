// 크리에이터 아바타 인터랙션 트리거 공용 스타일.
// CreatorAvatarPopover(팝오버 트리거)와 라이브 시청 LiveCreatorInfo(채널 링크)가 공유한다 —
// hover/focus 톤을 바꿀 땐 이 상수만 수정하면 모든 표면에 함께 반영된다.
// group 이름(avatar-trigger)은 래퍼·아바타 두 상수가 짝으로 쓰므로 한쪽만 바꾸면 안 된다.

export const CREATOR_AVATAR_TRIGGER_CLASS =
  "group/avatar-trigger focus-visible:ring-ring shrink-0 rounded-full outline-none focus-visible:ring-3";

// 라이브 링이 잘 안 보이는 사이드바에서도 hover 피드백을 주기 위해 투명도도 함께 변화.
export const CREATOR_AVATAR_TRIGGER_AVATAR_CLASS =
  "transition-[box-shadow,opacity] group-hover/avatar-trigger:ring-live/70 group-focus-visible/avatar-trigger:ring-live/70 group-hover/avatar-trigger:ring-2 group-focus-visible/avatar-trigger:ring-2 group-hover/avatar-trigger:opacity-85 group-focus-visible/avatar-trigger:opacity-85";
