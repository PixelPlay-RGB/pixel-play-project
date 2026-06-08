// notification 테이블 Row를 화면 타입(AppNotification)으로 변환합니다.
// actorNickname/actorPhotoUrl은 발행 시점에 스냅샷된 값(이벤트 로그 의도)이라,
// 크리에이터가 이후 닉네임/사진을 바꿔도 과거 알림에는 반영되지 않는다.
import type { Database } from "@/types/database.types";
import type { AppNotification, NotificationType } from "@/types/notification/notification";

type NotificationRow = Database["public"]["Tables"]["notification"]["Row"];

export function parseNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    type: row.type as NotificationType,
    actorId: row.actor_id,
    actorNickname: row.actor_nickname,
    actorPhotoUrl: row.actor_photo_url,
    title: row.title,
    body: row.body,
    linkPath: row.link_path,
    createdAt: row.created_at,
  };
}
