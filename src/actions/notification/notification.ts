"use server";
// 알림 읽음(방문 기준) 처리 Server Action. service_role 전용 RPC를 admin client로 호출합니다.
import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { AppActionResult } from "@/types/common/action";

export async function markNotificationsSeenAction(): Promise<AppActionResult> {
  const actor = await getAuthenticatedActorId({
    logLabel: "알림 읽음 처리 중 인증 유저 조회 실패",
  });
  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("mark_notifications_seen", {
    p_actor_user_id: actor.userId,
  });

  if (error) {
    console.error("알림 읽음 처리 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  return { success: true };
}

export async function deleteAllNotificationsAction(): Promise<AppActionResult> {
  const actor = await getAuthenticatedActorId({
    logLabel: "알림 전체 삭제 중 인증 유저 조회 실패",
  });
  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("delete_all_notifications", {
    p_actor_user_id: actor.userId,
  });

  if (error) {
    console.error("알림 전체 삭제 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.notification.deleteFailed };
  }

  return { success: true };
}

export async function deleteNotificationAction(notificationId: string): Promise<AppActionResult> {
  const actor = await getAuthenticatedActorId({
    logLabel: "알림 삭제 중 인증 유저 조회 실패",
  });
  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("delete_notification", {
    p_actor_user_id: actor.userId,
    p_notification_id: notificationId,
  });

  if (error) {
    console.error("알림 삭제 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.notification.deleteFailed };
  }

  return { success: true };
}
