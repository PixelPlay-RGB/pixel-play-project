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

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isRotating && setOpen(next)}>
      <AlertDialogTrigger
        render={
          <Button variant="destructive" disabled={disabled}>
            {isRotating ? <Spinner /> : <RefreshCw />}새 주소 만들기
          </Button>
        }
      />
      <SecurityReissueDialogContent
        icon={icon}
        title={`${title}를 새로 만들까요?`}
        description="새 주소를 만들면 OBS에 넣어둔 기존 주소는 더 이상 표시되지 않습니다. 만든 뒤에는 새 주소를 다시 붙여 넣어주세요."
        warnings={[
          "방송 중이라면 해당 화면이 잠시 사라질 수 있습니다.",
          "새 주소를 복사해 OBS 브라우저 소스에 다시 넣어주세요.",
        ]}
        isRotating={isRotating}
        onConfirm={() => onRotate(tokenKind, () => setOpen(false))}
      />
    </AlertDialog>
  );
}
