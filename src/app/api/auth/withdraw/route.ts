// 회원가입 취소 시 인증 계정을 삭제하는 API 라우트

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import { AuthError } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { code: APP_MESSAGE_CODE.error.auth.authInfoNotFound },
      { status: 401 },
    );
  }

  try {
    const adminClient = createAdminClient();

    const { error } = await adminClient.auth.admin.deleteUser(user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: "success" });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      console.error("회원 탈퇴 중 인증 유저 삭제 실패", error);
      return NextResponse.json(
        { code: APP_MESSAGE_CODE.error.auth.accountDeleteFailed },
        { status: error.status || 500 },
      );
    }

    if (error instanceof Error) {
      console.error("회원 탈퇴 중 사용자 삭제 실패", error);
      return NextResponse.json(
        { code: APP_MESSAGE_CODE.error.auth.accountDeleteFailed },
        { status: 500 },
      );
    }

    console.error("회원 탈퇴 중 알 수 없는 오류 발생", error);
    return NextResponse.json(
      { code: APP_MESSAGE_CODE.error.auth.accountDeleteFailed },
      { status: 500 },
    );
  }
}
