"use server";
// 채널 보안 설정의 토큰 버전 재발급 mutation을 처리합니다.

import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { CHANNEL_SECURITY_TOKEN_KIND_SET } from "@/constants/channel/security";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type {
  ChannelSecurityTokenKind,
  ChannelSecurityVersionResult,
} from "@/types/channel/security";
import type { AppActionResult } from "@/types/common/action";
import { buildChannelSecurityVersionResult } from "@/utils/channel/channel-security-snapshot";

const CHANNEL_SECURITY_ROTATE_FAILED_CODE =
  APP_MESSAGE_CODE.error.channel.securityTokenRotateFailed;

export async function rotateChannelSecurityTokenAction(
  tokenKind: ChannelSecurityTokenKind,
): Promise<AppActionResult<ChannelSecurityVersionResult>> {
  if (!CHANNEL_SECURITY_TOKEN_KIND_SET.has(tokenKind)) {
    return {
      success: false,
      code: CHANNEL_SECURITY_ROTATE_FAILED_CODE,
    };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "채널 보안 토큰 재발급 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return {
      success: false,
      code: actor.result.code,
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("rotate_live_security_token_version", {
    p_actor_user_id: actor.userId,
    p_token_kind: tokenKind,
  });

  if (error) {
    console.error("채널 보안 토큰 재발급 실패", error);
    return {
      success: false,
      code: CHANNEL_SECURITY_ROTATE_FAILED_CODE,
    };
  }

  try {
    const result = buildChannelSecurityVersionResult(actor.userId, data);

    if (result.tokenKind !== tokenKind) {
      throw new Error("채널 보안 토큰 재발급 응답 종류 불일치");
    }

    return {
      success: true,
      data: result,
      code: APP_MESSAGE_CODE.success.channel.securityTokenRotated,
    };
  } catch (error) {
    console.error("채널 보안 토큰 재발급 응답 표시값 생성 실패", error);
    return {
      success: false,
      code: CHANNEL_SECURITY_ROTATE_FAILED_CODE,
    };
  }
}
