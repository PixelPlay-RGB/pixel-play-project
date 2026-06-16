"use client";
// 구독 시그니처 이모티콘 제목과 이미지를 신청하는 Dialog를 렌더링합니다.

import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { useRef, useState, useTransition, type FormEvent } from "react";

import { uploadChannelSubscriptionEmoteAction } from "@/actions/channel/subscription-emote";
import {
  CopyrightAgreement,
  InfoNotice,
  SquareUploadButton,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { FORM_MESSAGE } from "@/constants/common/form-message";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import type { ChannelSubscriptionEmoteTier } from "@/utils/channel/channel-subscription-emote-upload";

type UploadTarget = "pc" | "mobile";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignatureEmoteRegistrationDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const pcInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const [tier, setTier] = useState<ChannelSubscriptionEmoteTier>("common");
  const [title, setTitle] = useState("");
  const [pcFile, setPcFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setFieldError(FORM_MESSAGE.channelSubscription.emoteTitleRequired);
      return;
    }

    if (!pcFile || !mobileFile) {
      setFieldError(FORM_MESSAGE.channelSubscription.emoteImagesRequired);
      return;
    }

    if (!agreed) {
      setFieldError(FORM_MESSAGE.channelSubscription.copyrightAgreementRequired);
      return;
    }

    const formData = new FormData();
    formData.append("tier", tier);
    formData.append("title", title);
    formData.append("pcFile", pcFile);
    formData.append("mobileFile", mobileFile);

    startTransition(async () => {
      try {
        const result = await uploadChannelSubscriptionEmoteAction(formData);
        if (!result.success) {
          toastAppError(result.code ?? APP_MESSAGE_CODE.error.channel.subscriptionEmoteSaveFailed);
          return;
        }

        toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.channel.subscriptionEmoteSaved);
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error("구독 이모티콘 등록 실패", error);
        toastAppError(APP_MESSAGE_CODE.error.channel.subscriptionEmoteSaveFailed);
      }
    });
  }

  function handleFileChange(target: UploadTarget, file: File | undefined) {
    if (target === "pc") {
      setPcFile(file ?? null);
    } else {
      setMobileFile(file ?? null);
    }
    setFieldError(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-md">
        <DialogHeader className="px-7 pt-8 pb-4">
          <DialogTitle className="text-xl font-black">이모티콘 신청하기</DialogTitle>
          <DialogDescription className="sr-only">
            구독 시그니처 이모티콘 제목과 이미지를 등록합니다.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-5 px-7 pb-8" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-3">
              <span className="text-sm font-black">구독 구분</span>
              <RadioGroup
                value={tier}
                className="flex w-auto flex-wrap gap-6"
                onValueChange={(nextValue) => {
                  if (nextValue === "common" || nextValue === "plus") {
                    setTier(nextValue);
                  }
                }}
              >
                <label className="flex items-center gap-2 text-sm font-medium">
                  <RadioGroupItem value="common" />
                  공통
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <RadioGroupItem value="plus" />
                  플러스
                </label>
              </RadioGroup>
            </div>
            <Button type="button" variant="link" size="sm" className="h-auto px-0 text-xs">
              제작가이드
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="subscription-emote-title" className="text-sm font-black">
              이모티콘 제목
            </label>
            <Input
              id="subscription-emote-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setFieldError(null);
              }}
              placeholder="이모티콘 제목을 입력해주세요."
              className="h-11"
            />
            <p className="text-muted-foreground text-xs">한글 최대 6자, 영어/숫자 최대 12자</p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-black">이미지 업로드</span>
            <input
              ref={pcInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => handleFileChange("pc", event.target.files?.[0])}
            />
            <input
              ref={mobileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => handleFileChange("mobile", event.target.files?.[0])}
            />
            <div className="flex justify-center gap-5">
              <SquareUploadButton
                label="PC이미지"
                detail="(26x26)"
                fileName={pcFile?.name}
                onClick={() => pcInputRef.current?.click()}
              />
              <SquareUploadButton
                label="모바일 이미지"
                detail="(54x54)"
                fileName={mobileFile?.name}
                onClick={() => mobileInputRef.current?.click()}
              />
            </div>
          </div>

          <InfoNotice>PC와 모바일 이미지는 동일하되 사이즈만 다르게 등록해주세요.</InfoNotice>

          <CopyrightAgreement checked={agreed} onChange={setAgreed} />

          {fieldError ? <p className="text-destructive text-sm font-medium">{fieldError}</p> : null}

          <Button type="submit" size="lg" className="h-11 w-full font-black" disabled={isPending}>
            <Upload className="size-4" />
            {isPending ? "신청 중" : "신청하기"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
