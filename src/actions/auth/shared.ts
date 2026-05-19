// Auth Server Action에서 공유하는 중복 확인 helper와 응답 타입을 관리합니다.
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { AppActionResult } from "@/types/common/action";

export interface ActionResponse extends AppActionResult {
  photoUrl?: string | null;
}

type DuplicateCheckResult =
  | {
      success: true;
      exists: boolean;
    }
  | {
      success: false;
    };

export async function checkEmailExists(email: string): Promise<DuplicateCheckResult> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("check_email_exists", {
      target_email: email,
    });

    if (error) {
      console.error("이메일 중복 확인 실패", error);
      return { success: false };
    }

    return { success: true, exists: Boolean(data) };
  } catch (error) {
    console.error("이메일 중복 확인용 Admin Client 생성 실패", error);
    return { success: false };
  }
}

export async function checkNicknameExists(nickname: string): Promise<DuplicateCheckResult> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("user")
      .select("id")
      .eq("nickname", nickname)
      .maybeSingle();

    if (error) {
      console.error("닉네임 중복 확인 실패", error);
      return { success: false };
    }

    return { success: true, exists: Boolean(data) };
  } catch (error) {
    console.error("닉네임 중복 확인용 Admin Client 생성 실패", error);
    return { success: false };
  }
}
