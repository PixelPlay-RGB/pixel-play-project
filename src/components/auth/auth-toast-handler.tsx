"use client";

import { useUser } from "@/hooks/use-profile";
import { toastAppSuccess } from "@/utils/toast-message";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function AuthToastInner({ nickname }: { nickname: string }) {
  const searchParams = useSearchParams();
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
      toastAppSuccess("success.auth.linked");
      params.delete("linked");
    } else if (isLogin) {
      toastAppSuccess("success.auth.login", `${nickname}님 환영합니다!`);
      params.delete("login");
    } else if (isWelcome) {
      toastAppSuccess("success.auth.signup", `${nickname}님 환영합니다!`);
      params.delete("welcome");
    }

    const currentPath = window.location.pathname;
    if (currentPath.includes("profile")) {
      router.replace("/profile");
      return;
    }

    // 토스트 표시 후 URL에서 파라미터 제거 (새로고침 시 재표시 방지)
    const newUrl = params.size > 0 ? `?${params.toString()}` : "/";
    router.replace(newUrl, { scroll: false });
  }, [searchParams, router, nickname]);

  return null;
}

export default function AuthToastHandler() {
  const { data: user, isLoading } = useUser();

  if (isLoading || !user) {
    return null;
  }

  return (
    <Suspense>
      <AuthToastInner nickname={user.nickname} />
    </Suspense>
  );
}
