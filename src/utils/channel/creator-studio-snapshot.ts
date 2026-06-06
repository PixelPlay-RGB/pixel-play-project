// 크리에이터 스튜디오 스냅샷(get_creator_studio_snapshot) 조회의 공통 서버 구현.
// 인증 유저 확인 → admin RPC 호출 → build try/catch 골격을 도메인(채팅/보안/후원)이 공유한다.
import "server-only";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { AppMessageCode } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import type { AppActionResult } from "@/types/common/action";
import type { Json } from "@/types/database.types";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";

interface GetCreatorStudioSnapshotOptions<T> {
  build: (creatorId: string, snapshot: Json) => T;
  loadFailedCode: AppMessageCode;
  logLabel: string;
}

export async function getCreatorStudioSnapshot<T>({
  build,
  loadFailedCode,
  logLabel,
}: GetCreatorStudioSnapshotOptions<T>): Promise<AppActionResult<T>> {
  const serverClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await serverClient.auth.getUser();

  if (userError && !isAuthSessionMissingError(userError)) {
    console.error(`${logLabel} 중 인증 유저 조회 실패`, userError);
  }

  if (!user) {
    return { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoNotFound };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_creator_studio_snapshot", {
    p_actor_user_id: user.id,
  });

  if (error) {
    console.error(`${logLabel} 실패`, error);
    return { success: false, code: loadFailedCode };
  }

  try {
    return { success: true, data: build(user.id, data) };
  } catch (buildError) {
    console.error(`${logLabel} 표시값 생성 실패`, buildError);
    return { success: false, code: loadFailedCode };
  }
}
