"use client";

import { useUser } from "@/hooks/use-profile";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";

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
      toast.success("계정 연동 완료", {
        description: "기존 계정과 소셜 로그인이 연동되었습니다.",
      });
      params.delete("linked");
    } else if (isLogin) {
      toast.success("로그인 성공", {
        description: `🥳 ${nickname}님 환영합니다!`,
      });
      params.delete("login");
    } else if (isWelcome) {
      toast.success("회원가입 성공!", {
        description: `🥳 ${nickname}님 환영합니다!`,
      });
      params.delete("welcome");
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
