// 인증 페이지 접근 시 현재 로그인 상태에 따라 redirect를 결정합니다.
import { redirect } from "next/navigation";

import { getCurrentProfileSnapshot } from "@/utils/profile/profile-server";
import { sanitizeRedirectPath } from "@/utils/common/redirect";

export async function redirectAuthenticatedUserFromAuthPage(next?: string | null) {
  const { hasAuthUser, profile } = await getCurrentProfileSnapshot();

  if (!hasAuthUser) {
    return;
  }

  if (profile) {
    redirect(sanitizeRedirectPath(next));
  }

  const redirectPath = sanitizeRedirectPath(next);
  redirect(`/auth/complete-profile?next=${encodeURIComponent(redirectPath)}`);
}
