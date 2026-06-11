import { Database } from "@/types/database.types";
import { hasEmailProvider } from "@/utils/auth/auth-provider";
import { createPathWithNext } from "@/utils/common/redirect";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getCurrentPathWithSearch(request: NextRequest) {
  const pathname =
    request.nextUrl.pathname === "/user" ? "/user/profile" : request.nextUrl.pathname;

  return `${pathname}${request.nextUrl.search}`;
}

// 공개 채널: /channel/<creatorId(UUID)>/... 이하. 스튜디오(/channel/live·chat 등)는
// UUID가 아니라 이 패턴에 안 걸리므로 로그인 보호가 유지된다.
// (설정 등 소유자 전용 하위 페이지는 각 page가 isOwnChannel로 자체 가드한다.)
const PUBLIC_CHANNEL_PATTERN =
  /^\/channel\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:\/|$)/i;

function isPublicRoute(pathname: string) {
  return pathname === "/" || pathname.startsWith("/live/") || PUBLIC_CHANNEL_PATTERN.test(pathname);
}

function isPublicAuthRoute(pathname: string) {
  return pathname === "/auth/login" || pathname === "/auth/signup" || pathname === "/auth/callback";
}

function isApiRoute(pathname: string) {
  return pathname.startsWith("/api/");
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const { pathname } = request.nextUrl;
  const isCompleteProfilePage = pathname === "/auth/complete-profile";
  const currentPath = getCurrentPathWithSearch(request);

  // 비로그인 처리
  if (!user && !isApiRoute(pathname) && !isPublicRoute(pathname) && !isPublicAuthRoute(pathname)) {
    const url = request.nextUrl.clone();
    const loginPath = createPathWithNext("/auth/login", currentPath);
    url.pathname = "/auth/login";
    url.search = new URL(loginPath, request.url).search;
    return NextResponse.redirect(url);
  }

  // 로그인된 유저의 추가 정보 확인 (DB 조회)
  if (user && !pathname.startsWith("/api") && !isPublicAuthRoute(pathname)) {
    // '프로필 완성' 체크를 위한 DB 조회
    const { data: profile, error: profileError } = await supabase
      .from("user")
      .select("nickname")
      .eq("id", user.sub)
      .maybeSingle();

    if (profileError) {
      console.error("프록시 프로필 완성 여부 조회 실패", profileError);
    }

    // 닉네임(display_name)이 없다면 프로필 설정 페이지로 강제 이동
    const isEmailSignupInProgress =
      !profile?.nickname && hasEmailProvider(user.app_metadata?.providers);

    if (!profile?.nickname && isEmailSignupInProgress && isPublicRoute(pathname)) {
      return supabaseResponse;
    }

    if (!profile?.nickname && !isCompleteProfilePage) {
      const url = request.nextUrl.clone();
      const completeProfilePath = createPathWithNext("/auth/complete-profile", currentPath);
      url.pathname = "/auth/complete-profile";
      url.search = new URL(completeProfilePath, request.url).search;
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies
        .getAll()
        .forEach((c) => redirectResponse.cookies.set(c.name, c.value));
      return redirectResponse;
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
