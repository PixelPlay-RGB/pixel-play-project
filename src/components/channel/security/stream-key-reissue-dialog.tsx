"use client";
// 스트림 키 재발급 확인 Dialog를 렌더링합니다.

import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { SecurityReissueDialogContent } from "@/components/channel/security/security-reissue-dialog-content";
import { Spinner } from "@/components/ui/spinner";
import type { ChannelSecurityTokenKind } from "@/types/channel/security";
import { KeyRound, RefreshCw } from "lucide-react";
import { useState } from "react";

export function StreamKeyReissueDialog({
  disabled,
  isRotating,
  onRotate,
}: {
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
            {isRotating ? <Spinner /> : <RefreshCw />}새 키 만들기
          </Button>
        }
      />
      <SecurityReissueDialogContent
        icon={KeyRound}
        title="스트림 키를 새로 만들까요?"
        description={`새 키를 만들면 지금 OBS에 저장된 키는 더 이상 쓸 수 없어요.\n새 키를 복사해서 OBS에 다시 붙여 넣어주세요.`}
        warnings={[
          "방송 중이라면 송출이 끊길 수 있어요.",
          "새 키를 OBS에 넣기 전까지는 방송을 시작할 수 없어요.",
        ]}
        confirmLabel="새 키 만들기"
        isRotating={isRotating}
        onConfirm={() => onRotate("stream_key", () => setOpen(false))}
      />
    </AlertDialog>
  );
}
