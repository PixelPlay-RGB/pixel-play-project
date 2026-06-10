// 라이브 추첨 참여자 목록을 설정 옵션에 맞게 필터링합니다.

export interface ChannelLiveDrawFilterParticipant {
  firstMessageAt: string;
  isFollower: boolean;
  nickname: string;
  userId: string;
}

interface ChannelLiveDrawFilterOptions {
  excludePreviousWinners: boolean;
  followerOnly: boolean;
}

export function filterChannelLiveDrawParticipants(
  participants: ChannelLiveDrawFilterParticipant[],
  winnerUserIds: string[],
  options: ChannelLiveDrawFilterOptions,
) {
  const winnerUserIdSet = new Set(winnerUserIds);

  return participants.filter((participant) => {
    if (options.followerOnly && !participant.isFollower) {
      return false;
    }

    if (options.excludePreviousWinners && winnerUserIdSet.has(participant.userId)) {
      return false;
    }

    return true;
  });
}
