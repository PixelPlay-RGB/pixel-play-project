"use client";
// 구독뱃지 개월 수와 이미지를 등록하는 Dialog를 렌더링합니다.

import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { useRef, useState, useTransition, type FormEvent } from "react";

import { uploadChannelSubscriptionBadgeAction } from "@/actions/channel/subscription-badge";
import {
  CopyrightAgreement,
  formatUploadFileSize,
  InfoNotice,
  LargeUploadButton,
} from "@/components/channel/subscription/subscription-asset-upload-controls";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { FORM_MESSAGE } from "@/constants/common/form-message";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import {
  CHANNEL_SUBSCRIPTION_BADGE_IMAGE_SIZE,
  CHANNEL_SUBSCRIPTION_BADGE_MAX_FILE_SIZE,
} from "@/utils/channel/channel-subscription-badge-upload";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionBadgeRegistrationDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [month, setMonth] = useState("1");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!month.trim()) {
      setFieldError(FORM_MESSAGE.channelSubscription.badgeMonthInvalid);
      return;
    }

    if (!selectedFile) {
      setFieldError(FORM_MESSAGE.channelSubscription.badgeImageRequired);
      return;
    }

    if (!agreed) {
      setFieldError(FORM_MESSAGE.channelSubscription.copyrightAgreementRequired);
      return;
    }

    const formData = new FormData();
    formData.append("month", month);
    formData.append("file", selectedFile);

    startTransition(async () => {
      try {
        const result = await uploadChannelSubscriptionBadgeAction(formData);
        if (!result.success) {
          toastAppError(result.code ?? APP_MESSAGE_CODE.error.channel.subscriptionBadgeSaveFailed);
          return;
        }

        toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.channel.subscriptionBadgeSaved);
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error("구독뱃지 등록 실패", error);
        toastAppError(APP_MESSAGE_CODE.error.channel.subscriptionBadgeSaveFailed);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-md">
        <DialogHeader className="px-7 pt-8 pb-4">
          <DialogTitle className="text-xl font-black">구독뱃지 등록</DialogTitle>
          <DialogDescription className="sr-only">
            구독 개월 수와 구독뱃지 이미지를 등록합니다.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-5 px-7 pb-8" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label htmlFor="subscription-badge-month" className="text-sm font-black">
              구독뱃지 개월 수
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="subscription-badge-month"
                type="number"
                min={1}
                max={120}
                value={month}
                onChange={(event) => {
                  setMonth(event.target.value);
                  setFieldError(null);
                }}
                className="h-11 w-20"
              />
              <span className="text-sm">개월</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black">이미지 업로드</span>
              <Button type="button" variant="link" size="sm" className="h-auto px-0 text-xs">
                제작가이드
              </Button>
            </div>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs leading-5">
              <li>
                사이즈: {CHANNEL_SUBSCRIPTION_BADGE_IMAGE_SIZE}*
                {CHANNEL_SUBSCRIPTION_BADGE_IMAGE_SIZE}px / 파일크기:{" "}
                {formatUploadFileSize(CHANNEL_SUBSCRIPTION_BADGE_MAX_FILE_SIZE)} 내
              </li>
              <li>png 형식의 이미지 파일</li>
              <li>이미지 파일명: 영문, 숫자로 구성</li>
            </ul>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png"
              className="hidden"
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] ?? null);
                setFieldError(null);
              }}
            />
            <LargeUploadButton
              label="이미지 업로드"
              detail={`(${CHANNEL_SUBSCRIPTION_BADGE_IMAGE_SIZE}*${CHANNEL_SUBSCRIPTION_BADGE_IMAGE_SIZE}px)`}
              fileName={selectedFile?.name}
              onClick={() => fileInputRef.current?.click()}
            />
          </div>

          <CopyrightAgreement checked={agreed} onChange={setAgreed} />

          <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-xs leading-5">
            <li>신청한 구독뱃지는 기본적인 검수 진행 후 1일 1회 일괄 등록 예정입니다.</li>
            <li>기본 구독뱃지 슬롯은 1개월과 동일하며 이미지 등록 및 수정, 삭제가 가능합니다.</li>
            <li>개월 수는 직접 선택 및 입력이 가능합니다.</li>
          </ul>

          <InfoNotice>
            {CHANNEL_SUBSCRIPTION_BADGE_IMAGE_SIZE}*{CHANNEL_SUBSCRIPTION_BADGE_IMAGE_SIZE}px PNG
            파일로 등록해주시면 이미지가 선명해요.
          </InfoNotice>

          {fieldError ? <p className="text-destructive text-sm font-medium">{fieldError}</p> : null}

          <Button type="submit" size="lg" className="h-11 w-full font-black" disabled={isPending}>
            <Upload className="size-4" />
            {isPending ? "등록 중" : "등록하기"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
