import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (token.profileComplete === false) {
    return NextResponse.redirect(new URL("/auth/complete-profile", request.url));
  }

  return NextResponse.next();
}

// proxy 검증 path
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
