// 인앱 알림(수신함) 화면용 타입을 정의합니다.

export type NotificationType = "live_start" | "community_post";

export interface AppNotification {
  id: string;
  type: NotificationType;
  actorId: string;
  actorNickname: string | null;
  actorPhotoUrl: string | null;
  title: string;
  body: string | null;
  linkPath: string;
  createdAt: string;
}
