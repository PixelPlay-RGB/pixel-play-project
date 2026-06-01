// 서버 액션에서 쓰기 RPC에 사용할 Admin Supabase Client를 공통으로 준비합니다.
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { AppMessageCode } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { Database } from "@/types/database.types";
import type { AppActionResult } from "@/types/common/action";
import type { SupabaseClient } from "@supabase/supabase-js";

type WriteClient = SupabaseClient<Database>;

type AdminClientActionResult<T = undefined> =
  | {
      success: true;
      supabase: WriteClient;
    }
  | {
      success: false;
      result: AppActionResult<T>;
    };

export async function createWriteClientForAction<T = undefined>(
  logLabel: string,
  code: AppMessageCode = APP_MESSAGE_CODE.error.common.unknown,
): Promise<AdminClientActionResult<T>> {
  try {
    return {
      success: true,
      supabase: createAdminClient(),
    };
  } catch (adminError) {
    console.error(logLabel, adminError);
    return {
      success: false,
      result: {
        success: false,
        code,
      },
    };
  }
}
