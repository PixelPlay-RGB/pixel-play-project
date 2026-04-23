import { LINKED_PARAM, LOGIN_PARAM } from "@/constants/auth";
import { createClient } from "@/lib/supabase/server";
import { OAuthProvider } from "@/types/auth";
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
        .select("id, linked_providers")
        .eq("oauth_id", user.id)
        .single();

      if (!existingUser) {
        // 신규 OAuth 유저라면 추가 정보 입력 페이지로 보냄
        return NextResponse.redirect(`${origin}/auth/complete-profile`);
      }

      const VALID_PROVIDERS: OAuthProvider[] = ["google", "github"];
      const allProviders = ((user.app_metadata?.providers ?? []) as string[]).filter(
        (p): p is OAuthProvider => VALID_PROVIDERS.includes(p as OAuthProvider),
      );
      const knownProviders = existingUser.linked_providers ?? [];
      const newProviders = allProviders.filter((p) => !knownProviders.includes(p));

      if (newProviders.length > 0) {
        // 새 provider 연동 → DB 업데이트 후 LINKED
        await supabase
          .from("user")
          .update({ linked_providers: [...knownProviders, ...newProviders] })
          .eq("oauth_id", user.id);

        return NextResponse.redirect(`${origin}${next}${LINKED_PARAM}`);
      } else {
        return NextResponse.redirect(`${origin}${next}${LOGIN_PARAM}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth_callback_failed`);
}
