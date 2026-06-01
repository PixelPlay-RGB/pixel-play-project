// 채널 보안 설정 페이지의 서버 데이터를 조회합니다.
import "server-only";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import type { ChannelSecuritySnapshot } from "@/types/channel/security";
import type { AppActionResult } from "@/types/common/action";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";
import { buildChannelSecuritySnapshot } from "@/utils/channel/channel-security-snapshot";

export async function getChannelSecuritySnapshot(): Promise<
  AppActionResult<ChannelSecuritySnapshot>
> {
  const serverClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await serverClient.auth.getUser();

  if (userError && !isAuthSessionMissingError(userError)) {
    console.error("채널 보안 설정 조회 중 인증 유저 조회 실패", userError);
  }

  if (!user) {
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.auth.authInfoNotFound,
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_creator_studio_snapshot", {
    p_actor_user_id: user.id,
  });

  if (error) {
    console.error("채널 보안 설정 조회 실패", error);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.channel.securityLoadFailed,
    };
  }

  try {
    return {
      success: true,
      data: buildChannelSecuritySnapshot(user.id, data),
    };
  } catch (error) {
    console.error("채널 보안 표시값 생성 실패", error);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.channel.securityLoadFailed,
    };
  }
}
