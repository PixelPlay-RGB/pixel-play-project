import { LINKED_PARAM, LOGIN_PARAM } from "@/constants/auth";
import { createClient } from "@/lib/supabase/server";
import { LoginProvider } from "@/types/auth";
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
        .select("id, linked_providers, photo_url")
        .eq("oauth_id", user.id)
        .single();

      if (!existingUser) {
        // 신규 OAuth 유저라면 추가 정보 입력 페이지로 보냄
        return NextResponse.redirect(`${origin}/auth/complete-profile`);
      }

      const VALID_PROVIDERS: LoginProvider[] = ["google", "github"];
      const allProviders = ((user.app_metadata?.providers ?? []) as string[]).filter(
        (p): p is LoginProvider => VALID_PROVIDERS.includes(p as LoginProvider),
      );
      const knownProviders = existingUser.linked_providers ?? [];
      const newProviders = allProviders.filter((p) => !knownProviders.includes(p));

      // 업데이트가 필요한 필드만 payload로 구성
      const updatePayload: { linked_providers?: LoginProvider[]; photo_url?: string } = {};

      if (newProviders.length > 0) {
        updatePayload.linked_providers = [...knownProviders, ...newProviders];
      }

      // photo_url이 없을 때만 OAuth provider 값으로 백필 (기존 값 보호)
      if (!existingUser.photo_url && user.user_metadata?.avatar_url) {
        updatePayload.photo_url = user.user_metadata.avatar_url as string;
      }

      if (Object.keys(updatePayload).length > 0) {
        await supabase.from("user").update(updatePayload).eq("oauth_id", user.id);
      }

      return NextResponse.redirect(
        `${origin}${next}${newProviders.length > 0 ? LINKED_PARAM : LOGIN_PARAM}`,
      );
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth_callback_failed`);
}
