"use client";
// 결제 결과 메시지를 후원 지갑 화면에서 toast로 표시합니다.

import type { AppMessageCode } from "@/constants/common/app-message-code";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Props {
  code: AppMessageCode;
}

export function PaymentResultToast({ code }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (code.startsWith("success.")) {
      toastAppSuccess(code);
    } else {
      toastAppError(code);
    }

    const currentUrl = new URL(window.location.href);

    if (!currentUrl.searchParams.has("paymentStatus")) {
      return;
    }

    currentUrl.searchParams.delete("paymentStatus");
    router.replace(`${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`, {
      scroll: false,
    });
  }, [code, router]);

  return null;
}
