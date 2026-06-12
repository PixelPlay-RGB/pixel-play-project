// 채널 운영 RPC(jsonb) 응답을 화면 도메인 타입으로 정규화한다.
// get_channel_managers / search_channel_users 는 { items: [...] } 형태를 반환한다.
import type { ChannelManagerItem, ChannelUserCandidate } from "@/types/channel/moderation";
import type { Json } from "@/types/database.types";

function readObject(value: Json | undefined): Record<string, Json | undefined> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Json | undefined>;
}

function readItems(value: Json): Json[] {
  const object = readObject(value);
  const items = object?.items;

  return Array.isArray(items) ? items : [];
}

function readString(value: Json | undefined): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";

  return trimmed.length > 0 ? trimmed : null;
}

// get_channel_managers jsonb → ChannelManagerItem[]. managerId/닉네임/등록일이 없으면 깨진 행이라 버린다.
export function parseChannelManagers(value: Json): ChannelManagerItem[] {
  return readItems(value)
    .map((item) => {
      const object = readObject(item);
      if (!object) {
        return null;
      }

      const managerRelationId = readString(object.managerRelationId);
      const managerId = readString(object.managerId);
      const managerNickname = readString(object.managerNickname);
      const createdAt = readString(object.createdAt);

      // 닉네임은 목록·해제 다이얼로그가 대상을 식별하는 필수 필드라, 누락되면 깨진 행으로 보고 버린다.
      if (!managerRelationId || !managerId || !managerNickname || !createdAt) {
        return null;
      }

      return {
        managerRelationId,
        managerId,
        managerNickname,
        managerPhotoUrl: readString(object.managerPhotoUrl),
        createdById: readString(object.createdById),
        createdByNickname: readString(object.createdByNickname),
        createdAt,
      } satisfies ChannelManagerItem;
    })
    .filter((item): item is ChannelManagerItem => item !== null);
}

// search_channel_users jsonb → ChannelUserCandidate[]. userId/닉네임이 없으면 버린다.
export function parseChannelUserCandidates(value: Json): ChannelUserCandidate[] {
  return readItems(value)
    .map((item) => {
      const object = readObject(item);
      if (!object) {
        return null;
      }

      const userId = readString(object.userId);
      const nickname = readString(object.nickname);

      if (!userId || !nickname) {
        return null;
      }

      return {
        userId,
        nickname,
        photoUrl: readString(object.photoUrl),
      } satisfies ChannelUserCandidate;
    })
    .filter((item): item is ChannelUserCandidate => item !== null);
}
