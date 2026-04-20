import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const token =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!token) {
    NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

// proxy 검증 path
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
