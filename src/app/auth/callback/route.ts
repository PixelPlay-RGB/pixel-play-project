import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * OAuth 콜백 핸들러.
 * Supabase OAuth 플로우에서 provider가 code를 query string으로 전달하면,
 * 서버에서 exchangeCodeForSession으로 세션 쿠키를 설정한 뒤 목적지로 redirect.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && user) {
      const { data: existingUser } = await supabase
        .from("user")
        .select("id")
        .eq("oauth_id", user.id)
        .single();

      if (!existingUser) {
        // 신규 OAuth 유저라면 추가 정보 입력 페이지로 보냄
        return NextResponse.redirect(`${origin}/auth/complete-profile`);
      } else {
        // 기존 유저라면 언동 성공 파라미터를 달아서 메인으로
        return NextResponse.redirect(`${origin}${next}?linked=true`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth_callback_failed`);
}
