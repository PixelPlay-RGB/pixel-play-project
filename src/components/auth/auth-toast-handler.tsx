"use client";
// auth-toast-handler 컴포넌트를 제공합니다.

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { useNullableUser } from "@/hooks/profile/use-profile";
import { toastAppSuccess } from "@/utils/common/toast-message";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function AuthToastInner({ nickname }: { nickname: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isLinked = searchParams.get("linked");
    const isLogin = searchParams.get("login");
    const isWelcome = searchParams.get("welcome");

    if (!isLinked && !isLogin && !isWelcome) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (isLinked) {
      toastAppSuccess(APP_MESSAGE_CODE.success.auth.linked);
      params.delete("linked");
    } else if (isLogin) {
      toastAppSuccess(APP_MESSAGE_CODE.success.auth.login, `${nickname}님 환영합니다!`);
      params.delete("login");
    } else if (isWelcome) {
      toastAppSuccess(APP_MESSAGE_CODE.success.auth.signup, `${nickname}님 환영합니다!`);
      params.delete("welcome");
    }

    // 토스트 표시 후 URL에서 파라미터만 제거해 next redirect 경로를 보존
    const newUrl = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, pathname, router, nickname]);

  return null;
}

export default function AuthToastHandler() {
  return (
    <Suspense>
      <AuthToastQueryGate />
    </Suspense>
  );
}

function AuthToastQueryGate() {
  const searchParams = useSearchParams();
  const shouldLoadUser =
    searchParams.has("linked") || searchParams.has("login") || searchParams.has("welcome");
  const { data: user, isLoading } = useNullableUser(shouldLoadUser);

  if (!shouldLoadUser || isLoading || !user) {
    return null;
  }

  return <AuthToastInner nickname={user.nickname} />;
}
