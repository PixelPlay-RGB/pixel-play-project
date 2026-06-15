"use server";
// 채널 운영(매니저 권한) 서버 액션. 신뢰 파라미터(actor=auth.uid())를 받는 service_role RPC를 호출한다.

import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { AppMessageCode } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { AppActionResult } from "@/types/common/action";
import type { ChannelUserCandidate } from "@/types/channel/moderation";
import { parseChannelUserCandidates } from "@/utils/channel/channel-moderation";
import { isUuid } from "@/utils/common/uuid";

// 강퇴 RPC(ban_channel_viewer)의 sqlstate → 앱 메시지 코드 매핑.
// PX400(본인 강퇴)·PX403(스트리머/매니저/권한)은 모두 "강퇴 불가" 안내로 수렴한다.
function resolveBanRpcErrorCode(pgCode: string | undefined): AppMessageCode {
  if (pgCode === "PX400" || pgCode === "PX403") {
    return APP_MESSAGE_CODE.error.channel.viewerBanForbidden;
  }
  return APP_MESSAGE_CODE.error.channel.viewerBanFailed;
}

const USER_SEARCH_QUERY_MAX_LENGTH = 100;

// 닉네임/UUID 정확일치로 매니저 후보를 검색한다(부분검색 없음, 최대 10건).
export async function searchChannelUsersAction(
  query: string,
): Promise<AppActionResult<ChannelUserCandidate[]>> {
  const trimmed = query.trim();

  if (!trimmed || trimmed.length > USER_SEARCH_QUERY_MAX_LENGTH) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.userSearchFailed };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "매니저 검색 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("search_channel_users", { p_query: trimmed });

  if (error) {
    console.error("매니저 검색 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.userSearchFailed };
  }

  return { success: true, data: parseChannelUserCandidates(data) };
}

// 매니저 추가 — actor(=채널 주인)가 대상 유저에게 매니저 권한을 부여한다.
export async function addChannelManagerAction(targetUserId: string): Promise<AppActionResult> {
  if (!targetUserId || !isUuid(targetUserId)) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.managerAddFailed };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "매니저 추가 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("add_channel_manager", {
    p_actor_user_id: actor.userId,
    p_target_user_id: targetUserId,
  });

  if (error) {
    const pgCode = (error as { code?: string }).code;

    // PX409 = 선체크에서 걸린 중복, 23505 = 동시/더블서밋이 unique 제약에서 걸린 경우. 둘 다 같은 안내.
    if (pgCode === "PX409" || pgCode === "23505") {
      return { success: false, code: APP_MESSAGE_CODE.error.channel.managerAlreadyExists };
    }
    if (pgCode === "PX400") {
      return { success: false, code: APP_MESSAGE_CODE.error.channel.managerSelfForbidden };
    }
    // PX403 = 활성 밴 유저를 매니저로 지정하려는 경우(#119).
    if (pgCode === "PX403") {
      return { success: false, code: APP_MESSAGE_CODE.error.channel.managerBannedForbidden };
    }

    console.error("매니저 추가 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.managerAddFailed };
  }

  return { success: true, code: APP_MESSAGE_CODE.success.channel.managerAdded };
}

// 매니저 해제 — actor(=채널 주인)가 대상 유저의 매니저 권한을 회수한다. 멱등.
export async function removeChannelManagerAction(targetUserId: string): Promise<AppActionResult> {
  if (!targetUserId || !isUuid(targetUserId)) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.managerRemoveFailed };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "매니저 해제 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("remove_channel_manager", {
    p_actor_user_id: actor.userId,
    p_target_user_id: targetUserId,
  });

  if (error) {
    console.error("매니저 해제 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.managerRemoveFailed };
  }

  return { success: true, code: APP_MESSAGE_CODE.success.channel.managerRemoved };
}

// 시청자 강퇴 — actor(크리에이터/활성 매니저)가 대상 시청자를 채널 단위 영구 밴한다.
// broadcastId 는 사건 컨텍스트(어느 방송에서 강퇴했는지) 기록용이라 선택값이다.
export async function banChannelViewerAction(
  creatorId: string,
  targetUserId: string,
  broadcastId?: string,
): Promise<AppActionResult> {
  if (!creatorId || !isUuid(creatorId) || !targetUserId || !isUuid(targetUserId)) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.viewerBanFailed };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "시청자 강퇴 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("ban_channel_viewer", {
    p_actor_user_id: actor.userId,
    p_creator_id: creatorId,
    p_target_user_id: targetUserId,
    p_broadcast_id: broadcastId && isUuid(broadcastId) ? broadcastId : undefined,
  });

  if (error) {
    const pgCode = (error as { code?: string }).code;

    if (pgCode !== "PX400" && pgCode !== "PX403") {
      console.error("시청자 강퇴 RPC 실패", error);
    }

    return { success: false, code: resolveBanRpcErrorCode(pgCode) };
  }

  return { success: true, code: APP_MESSAGE_CODE.success.channel.viewerBanned };
}

// 시청자 강퇴 해제 — actor(크리에이터/활성 매니저)가 활성 밴을 해제한다. 멱등.
export async function unbanChannelViewerAction(
  creatorId: string,
  targetUserId: string,
): Promise<AppActionResult> {
  if (!creatorId || !isUuid(creatorId) || !targetUserId || !isUuid(targetUserId)) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.viewerUnbanFailed };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "시청자 강퇴 해제 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("unban_channel_viewer", {
    p_actor_user_id: actor.userId,
    p_creator_id: creatorId,
    p_target_user_id: targetUserId,
  });

  if (error) {
    console.error("시청자 강퇴 해제 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.viewerUnbanFailed };
  }

  return { success: true, code: APP_MESSAGE_CODE.success.channel.viewerUnbanned };
}
