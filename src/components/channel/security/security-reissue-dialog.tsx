"use client";
// 채널 보안 토큰 재발급 확인 Dialog를 렌더링합니다.

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ChannelSecurityTokenKind, ChannelSecurityUrlKind } from "@/types/channel/security";
import { RefreshCw, TriangleAlert } from "lucide-react";
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
            {isRotating ? <Spinner /> : <RefreshCw />}새 키 발급
          </Button>
        }
      />
      <SecurityReissueDialogContent
        title="스트림 키를 새로 발급할까요?"
        description="기존 스트림 키는 바로 사용할 수 없고, OBS 방송 설정에 새 키를 다시 붙여 넣어야 합니다."
        warnings={[
          "현재 OBS에 저장된 스트림 키는 더 이상 사용할 수 없습니다.",
          "방송 중이라면 송출이 끊길 수 있습니다.",
        ]}
        isRotating={isRotating}
        onConfirm={() => onRotate("stream_key", () => setOpen(false))}
      />
    </AlertDialog>
  );
}

export function UrlTokenReissueDialog({
  title,
  tokenKind,
  disabled,
  isRotating,
  onRotate,
}: {
  title: string;
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
            {isRotating ? <Spinner /> : <RefreshCw />}새 주소 발급
          </Button>
        }
      />
      <SecurityReissueDialogContent
        title={`${title}을 새로 발급할까요?`}
        description="기존 주소는 바로 사용할 수 없고, OBS 브라우저 소스에 새 주소를 다시 붙여 넣어야 합니다."
        warnings={[
          "기존 주소로 연결된 OBS 화면에는 더 이상 표시되지 않습니다.",
          "새 주소를 복사해 OBS 브라우저 소스에 다시 붙여 넣어주세요.",
        ]}
        isRotating={isRotating}
        onConfirm={() => onRotate(tokenKind, () => setOpen(false))}
      />
    </AlertDialog>
  );
}

function SecurityReissueDialogContent({
  title,
  description,
  warnings,
  isRotating,
  onConfirm,
}: {
  title: string;
  description: string;
  warnings: string[];
  isRotating: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialogContent className="overflow-hidden rounded-2xl p-0 shadow-xl data-[size=default]:max-w-sm data-[size=default]:sm:max-w-xl">
      <AlertDialogHeader className="border-destructive/10 bg-destructive/5 flex items-center gap-4 border-b px-6 pt-6 pb-5 text-left sm:gap-5 sm:px-7">
        <AlertDialogMedia className="bg-destructive/10 text-destructive ring-destructive/20 mb-0 size-12 shrink-0 rounded-xl ring-1">
          <TriangleAlert className="size-6" />
        </AlertDialogMedia>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <AlertDialogTitle className="text-xl leading-7 font-bold">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-base leading-6 text-pretty">
            {description}
          </AlertDialogDescription>
        </div>
      </AlertDialogHeader>
      <div className="px-6 py-5 sm:px-7">
        <div className="border-destructive/15 bg-destructive/5 grid gap-3 rounded-xl border p-4 text-base">
          {warnings.map((warning) => (
            <span key={warning} className="flex gap-3 leading-6">
              <TriangleAlert className="text-destructive mt-0.5 size-5 shrink-0" />
              {warning}
            </span>
          ))}
        </div>
      </div>
      <AlertDialogFooter className="m-0 flex-row justify-end gap-2 border-0 bg-transparent px-6 pt-0 pb-6 sm:px-7">
        <AlertDialogCancel disabled={isRotating} className="h-11 min-w-28">
          취소
        </AlertDialogCancel>
        <AlertDialogAction
          variant="destructive"
          disabled={isRotating}
          className="h-11 min-w-28"
          onClick={onConfirm}
        >
          {isRotating ? <Spinner /> : "새로 발급"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
