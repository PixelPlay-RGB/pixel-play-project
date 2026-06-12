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
      const createdAt = readString(object.createdAt);

      if (!managerRelationId || !managerId || !createdAt) {
        return null;
      }

      return {
        managerRelationId,
        managerId,
        managerNickname: readString(object.managerNickname) ?? "알 수 없음",
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
