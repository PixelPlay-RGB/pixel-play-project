"use client";
// OBS 브라우저 소스 주소 재발급 확인 Dialog를 렌더링합니다.

import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { SecurityReissueDialogContent } from "@/components/channel/security/security-reissue-dialog-content";
import { Spinner } from "@/components/ui/spinner";
import type { ChannelSecurityTokenKind, ChannelSecurityUrlKind } from "@/types/channel/security";
import type { LucideIcon } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export function UrlTokenReissueDialog({
  title,
  icon,
  tokenKind,
  disabled,
  isRotating,
  onRotate,
}: {
  title: string;
  icon: LucideIcon;
  tokenKind: ChannelSecurityUrlKind;
  disabled: boolean;
  isRotating: boolean;
  onRotate: (tokenKind: ChannelSecurityTokenKind, onSuccess?: () => void) => void;
}) {
  const [open, setOpen] = useState(false);
  const visibleTargetLabel = tokenKind === "chat_overlay" ? "채팅창" : "후원 알림";

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isRotating && setOpen(next)}>
      <AlertDialogTrigger
        render={
          <Button
            variant="destructive"
            disabled={disabled}
            // 비활성 사유(다른 보안 값 재발급 진행 중)를 hover로 알 수 있게 한다.
            title={disabled && !isRotating ? "다른 보안 값을 발급하는 중이에요." : undefined}
          >
            {isRotating ? <Spinner /> : <RefreshCw />}새 주소 만들기
          </Button>
        }
      />
      <SecurityReissueDialogContent
        icon={icon}
        title={`${title}를 새로 만들까요?`}
        description={`새 주소를 만들면 지금 OBS에 넣어둔 주소는 더 이상 쓸 수 없어요.\n새 주소를 복사해서 OBS 브라우저 소스에 다시 붙여 넣어주세요.`}
        warnings={[
          `방송 중이라면 ${visibleTargetLabel}이 잠시 사라질 수 있어요.`,
          `새 주소를 넣기 전까지 ${visibleTargetLabel}을 다시 띄울 수 없어요.`,
        ]}
        confirmLabel="새 주소 만들기"
        isRotating={isRotating}
        onConfirm={() => onRotate(tokenKind, () => setOpen(false))}
      />
    </AlertDialog>
  );
}
