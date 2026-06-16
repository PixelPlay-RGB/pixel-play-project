// 추첨 참여 메시지 행을 공지별 참여자 정보로 집계하는 순수 함수를 제공합니다.
import type { Json } from "@/types/database.types";
import type { LiveInteractionNotice } from "@/types/live/live";
import { readJsonObject, readString } from "@/utils/common/json";

export interface LiveDrawParticipationRow {
  created_at: string;
  metadata: Json;
  sender: { nickname: string | null } | null;
  sender_id: string | null;
}

// 참여 행을 공지별 닉네임 목록·중복 제거된 참여자 집합으로 모으고,
// viewer가 참여한 공지에는 hasJoined를 표시해 draw 공지에 병합한다.
export function mergeDrawParticipationIntoNotices(
  notices: LiveInteractionNotice[],
  participationRows: LiveDrawParticipationRow[],
  viewerId?: string | null,
): LiveInteractionNotice[] {
  const joinedDrawNoticeIds = new Set(
    participationRows.flatMap((row) => {
      const metadata = readJsonObject(row.metadata);
      const drawNoticeId = readString(metadata.drawNoticeId);

      return viewerId && row.sender_id === viewerId && drawNoticeId ? [drawNoticeId] : [];
    }),
  );
  const participantNamesByDrawNoticeId = new Map<string, string[]>();
  const participantUserIdsByDrawNoticeId = new Map<string, Set<string>>();

  participationRows.forEach((row) => {
    if (!row.sender_id) return;

    const metadata = readJsonObject(row.metadata);
    const drawNoticeId = readString(metadata.drawNoticeId);

    if (!drawNoticeId) return;

    const participantUserIds =
      participantUserIdsByDrawNoticeId.get(drawNoticeId) ?? new Set<string>();

    if (participantUserIds.has(row.sender_id)) {
      return;
    }

    participantUserIds.add(row.sender_id);
    participantUserIdsByDrawNoticeId.set(drawNoticeId, participantUserIds);

    const participantNames = participantNamesByDrawNoticeId.get(drawNoticeId) ?? [];
    participantNames.push(row.sender?.nickname ?? readString(metadata.senderNickname) ?? "시청자");
    participantNamesByDrawNoticeId.set(drawNoticeId, participantNames);
  });

  return notices.map((notice) =>
    notice.type === "draw"
      ? {
          ...notice,
          hasJoined: joinedDrawNoticeIds.has(notice.drawNoticeId ?? notice.id),
          participantCount:
            participantNamesByDrawNoticeId.get(notice.drawNoticeId ?? notice.id)?.length ??
            notice.participantCount,
          participantNames:
            participantNamesByDrawNoticeId.get(notice.drawNoticeId ?? notice.id) ?? [],
        }
      : notice,
  );
}
