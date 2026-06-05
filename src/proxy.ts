// Next.js 프록시 미들웨어를 구성합니다.
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // 정적 자산(이미지·오디오·폰트 등)은 인증 가드를 거치지 않도록 제외합니다.
  // 특히 OBS 오버레이는 비로그인 상태로 열리므로, mp3 같은 정적 파일이 미들웨어에 걸려
  // /auth/login으로 리다이렉트되면 효과음이 재생되지 않습니다.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|ogg|m4a|mp4|webm|ico|woff|woff2|ttf|otf)$).*)",
  ],
};
