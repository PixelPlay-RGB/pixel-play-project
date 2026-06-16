"use client";
// 구독뱃지 개월 수와 이미지를 등록하는 Dialog를 렌더링합니다.

import { useRouter } from "next/navigation";
import { ImagePlus, Upload } from "lucide-react";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectList,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const DEFAULT_BADGE_MONTH = "1";
const CUSTOM_MONTH_OPTION_VALUE = "custom";

const BADGE_MONTH_OPTIONS = [
  { value: "1", label: "1개월" },
  { value: "2", label: "2개월" },
  { value: "3", label: "3개월" },
  { value: "6", label: "6개월" },
  { value: "9", label: "9개월" },
  { value: "12", label: "12개월" },
  { value: "18", label: "18개월" },
  { value: CUSTOM_MONTH_OPTION_VALUE, label: "직접 입력" },
] as const;

export function SubscriptionBadgeRegistrationDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [month, setMonth] = useState(DEFAULT_BADGE_MONTH);
  const [monthSelectValue, setMonthSelectValue] = useState(DEFAULT_BADGE_MONTH);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isCustomMonth = monthSelectValue === CUSTOM_MONTH_OPTION_VALUE;

  useEffect(() => {
    if (!previewSrc) return;

    return () => URL.revokeObjectURL(previewSrc);
  }, [previewSrc]);

  function resetForm() {
    setMonth(DEFAULT_BADGE_MONTH);
    setMonthSelectValue(DEFAULT_BADGE_MONTH);
    setSelectedFile(null);
    setPreviewSrc(null);
    setAgreed(false);
    setFieldError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  function handleMonthSelect(nextValue: string) {
    setMonthSelectValue(nextValue);
    setFieldError(null);

    if (nextValue === CUSTOM_MONTH_OPTION_VALUE) {
      setMonth("");
      return;
    }

    setMonth(nextValue);
  }

  function handleFileChange(file: File | null) {
    setSelectedFile(file);
    setPreviewSrc(file ? URL.createObjectURL(file) : null);
    setFieldError(null);
  }

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
        handleOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error("구독뱃지 등록 실패", error);
        toastAppError(APP_MESSAGE_CODE.error.channel.subscriptionBadgeSaveFailed);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-xl">
        <DialogHeader className="border-brand/10 bg-brand/5 flex-row items-start gap-4 border-b px-5 pt-5 pr-12 pb-4 text-left sm:px-6">
          <div className="bg-brand/10 text-brand ring-brand/20 flex size-12 shrink-0 items-center justify-center rounded-xl ring-1">
            <ImagePlus className="size-6" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1.5">
            <DialogTitle className="text-xl leading-7 font-bold">구독뱃지 등록</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            구독 개월 수와 구독뱃지 이미지를 등록합니다.
          </DialogDescription>
        </DialogHeader>

        <form className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
          <div className="flex max-h-[calc(100vh-13rem)] flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-6">
            <section className="border-border/70 bg-muted/30 flex flex-col gap-3 rounded-lg border p-4">
              <label htmlFor="subscription-badge-month" className="text-sm font-black">
                구독뱃지 개월 수
              </label>
              <Select
                value={monthSelectValue}
                items={BADGE_MONTH_OPTIONS}
                onValueChange={(nextValue) => handleMonthSelect(String(nextValue))}
              >
                <SelectTrigger
                  id="subscription-badge-month"
                  aria-label="구독뱃지 개월 수"
                  className="bg-background h-11 w-full sm:w-40"
                >
                  <SelectValue />
                  <SelectIcon />
                </SelectTrigger>
                <SelectContent>
                  <SelectList>
                    {BADGE_MONTH_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} label={option.label}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectContent>
              </Select>
              {isCustomMonth ? (
                <div className="flex items-center gap-2">
                  <Input
                    id="subscription-badge-custom-month"
                    type="number"
                    min={19}
                    max={120}
                    value={month}
                    onChange={(event) => {
                      setMonth(event.target.value);
                      setFieldError(null);
                    }}
                    placeholder="예: 24"
                    className="bg-background h-11 w-28"
                  />
                  <span className="text-sm">개월</span>
                </div>
              ) : null}
            </section>

            <section className="border-border/70 bg-muted/30 flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black">이미지 업로드</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-brand hover:bg-brand/10 hover:text-brand h-8 px-2 text-xs"
                >
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
                  handleFileChange(event.target.files?.[0] ?? null);
                }}
              />
              <LargeUploadButton
                label="이미지 업로드"
                detail={`(${CHANNEL_SUBSCRIPTION_BADGE_IMAGE_SIZE}*${CHANNEL_SUBSCRIPTION_BADGE_IMAGE_SIZE}px)`}
                fileName={selectedFile?.name}
                previewSrc={previewSrc}
                onClick={() => fileInputRef.current?.click()}
              />
            </section>

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

            {fieldError ? (
              <p className="text-destructive text-sm font-medium">{fieldError}</p>
            ) : null}
          </div>

          <DialogFooter className="m-0 flex-row justify-end gap-2 rounded-none border-t bg-transparent px-5 pt-4 pb-5 sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="h-10 min-w-24"
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="bg-brand hover:bg-brand/90 text-brand-foreground hover:text-brand-foreground shadow-brand/20 h-10 min-w-28 rounded-xl font-black shadow-sm"
              disabled={isPending}
            >
              <Upload className="size-4" />
              {isPending ? "등록 중" : "등록하기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
