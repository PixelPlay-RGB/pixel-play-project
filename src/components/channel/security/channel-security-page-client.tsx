"use client";
// 채널 보안 설정 화면의 민감 정보 표시와 토큰 재발급 UI를 제공합니다.

import { rotateChannelSecurityTokenAction } from "@/actions/channel/security";
import { ChannelSideTipCard, ChannelSideTipStep } from "@/components/channel/channel-side-tip-card";
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
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { CHANNEL_SECURITY_URL_CARD_META } from "@/constants/channel/security";
import { cn } from "@/lib/utils";
import type {
  ChannelSecuritySnapshot,
  ChannelSecurityTokenKind,
  ChannelSecurityUrlCardMeta,
  ChannelSecurityUrlKind,
} from "@/types/channel/security";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";

const ROTATE_SUCCESS_DESCRIPTION = {
  stream_key: "스트림 키가 새로 발급되었습니다.",
  chat_overlay: "OBS 채팅창 URL이 새로 발급되었습니다.",
  donation_alert: "OBS 후원 알림 URL이 새로 발급되었습니다.",
} satisfies Record<ChannelSecurityTokenKind, string>;

interface Props {
  initialSnapshot: ChannelSecuritySnapshot | null;
}

export default function ChannelSecurityPageClient({ initialSnapshot }: Props) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [rotatingKind, setRotatingKind] = useState<ChannelSecurityTokenKind | null>(null);
  const [visibleKinds, setVisibleKinds] = useState<ChannelSecurityTokenKind[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toastAppSuccess(APP_MESSAGE_CODE.success.channel.securityCopied);
    } catch (error) {
      console.error("채널 보안 정보 복사 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.channel.securityCopyFailed);
    }
  };

  const handlePreview = (url: string, popup: ChannelSecurityUrlCardMeta["popup"]) => {
    const left = window.screenX + Math.max((window.outerWidth - popup.width) / 2, 0);
    const top = window.screenY + Math.max((window.outerHeight - popup.height) / 2, 0);
    const features = [
      "popup=yes",
      `width=${popup.width}`,
      `height=${popup.height}`,
      `left=${Math.round(left)}`,
      `top=${Math.round(top)}`,
      "resizable=yes",
      "scrollbars=yes",
      "noopener",
      "noreferrer",
    ].join(",");

    window.open(url, `pixelplay_obs_${popup.width}x${popup.height}`, features);
  };

  const handleToggleVisible = (tokenKind: ChannelSecurityTokenKind) => {
    setVisibleKinds((current) =>
      current.includes(tokenKind)
        ? current.filter((item) => item !== tokenKind)
        : [...current, tokenKind],
    );
  };

  const handleRotate = (tokenKind: ChannelSecurityTokenKind, onSuccess?: () => void) => {
    setRotatingKind(tokenKind);
    startTransition(async () => {
      try {
        const result = await rotateChannelSecurityTokenAction(tokenKind);

        if (!result.success || !result.data) {
          toastAppError(result.code ?? APP_MESSAGE_CODE.error.channel.securityTokenRotateFailed);
          return;
        }

        setSnapshot(result.data.snapshot);
        toastAppSuccess(
          result.code ?? APP_MESSAGE_CODE.success.channel.securityTokenRotated,
          ROTATE_SUCCESS_DESCRIPTION[result.data.tokenKind],
        );
        onSuccess?.();
      } catch (error) {
        console.error("채널 보안 토큰 재발급 요청 실패", error);
        toastAppError(APP_MESSAGE_CODE.error.channel.securityTokenRotateFailed);
      } finally {
        setRotatingKind(null);
      }
    });
  };

  if (!snapshot) {
    return <SecurityLoadFailedState />;
  }

  const isRotating = isPending && rotatingKind !== null;

  return (
    <main className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-2">
          <span className="text-brand text-sm font-bold">OBS 보안 정보</span>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">보안 설정</h1>
          <p className="text-muted-foreground text-sm leading-6">
            OBS Studio에 붙여 넣을 방송 연결 정보와 채팅창·후원 알림 주소를 관리합니다. 민감한
            정보는 확인 버튼을 누른 뒤에만 전체 내용을 보여줍니다.
          </p>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="flex min-w-0 flex-col gap-4">
          <StreamKeyCard
            snapshot={snapshot}
            disabled={isRotating}
            isRotating={rotatingKind === "stream_key" && isPending}
            isStreamKeyVisible={visibleKinds.includes("stream_key")}
            onCopy={handleCopy}
            onToggleVisible={handleToggleVisible}
            onRotate={handleRotate}
          />
          {CHANNEL_SECURITY_URL_CARD_META.map((meta) => (
            <ObsUrlCard
              key={meta.tokenKind}
              meta={meta}
              snapshot={snapshot}
              disabled={isRotating}
              isRotating={rotatingKind === meta.tokenKind && isPending}
              isUrlVisible={visibleKinds.includes(meta.tokenKind)}
              onCopy={handleCopy}
              onPreview={(url) => handlePreview(url, meta.popup)}
              onToggleVisible={handleToggleVisible}
              onRotate={handleRotate}
            />
          ))}
        </section>

        <ChannelSideTipCard
          icon={<ShieldCheck className="size-5" />}
          title="보안 원칙"
          description="스트림 키와 OBS 주소는 처음에는 숨겨둡니다. 새로 발급하면 OBS에 저장한 정보도 다시 바꿔야 합니다."
        >
          <ChannelSideTipStep
            number="1"
            title="스트림 URL과 스트림 키를 OBS에 입력"
            description="OBS 방송 설정의 서버와 스트림 키 입력란에 각각 붙여 넣습니다."
          />
          <ChannelSideTipStep
            number="2"
            title="채팅창 URL을 OBS에 추가"
            description="OBS 브라우저 소스에 붙여 넣으면 방송 화면에 채팅창이 표시됩니다."
          />
          <ChannelSideTipStep
            number="3"
            title="후원 알림 URL을 OBS에 따로 추가"
            description="후원 알림은 채팅창과 분리해서 방송 화면에 표시합니다."
          />
        </ChannelSideTipCard>
      </div>
    </main>
  );
}

function StreamKeyCard({
  snapshot,
  disabled,
  isRotating,
  isStreamKeyVisible,
  onCopy,
  onToggleVisible,
  onRotate,
}: {
  snapshot: ChannelSecuritySnapshot;
  disabled: boolean;
  isRotating: boolean;
  isStreamKeyVisible: boolean;
  onCopy: (value: string) => Promise<void>;
  onToggleVisible: (tokenKind: ChannelSecurityTokenKind) => void;
  onRotate: (tokenKind: ChannelSecurityTokenKind, onSuccess?: () => void) => void;
}) {
  return (
    <Card className="border-live/15 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="text-live size-4" />
          스트림 설정
        </CardTitle>
        <CardDescription>스트림 URL과 스트림 키를 OBS 방송 설정에 입력합니다.</CardDescription>
        <CardAction className="col-start-1 row-start-3 justify-self-start pt-2 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end sm:pt-0">
          <StreamKeyReissueDialog disabled={disabled} isRotating={isRotating} onRotate={onRotate} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <SecurityFieldRow
          label="스트림 URL"
          value={snapshot.streamServerUrl}
          action={
            <Button
              variant="outline"
              disabled={disabled}
              onClick={() => void onCopy(snapshot.streamServerUrl)}
            >
              <Copy />
              복사
            </Button>
          }
        />
        <SecurityFieldRow
          className="mt-3"
          label="스트림 키"
          value={isStreamKeyVisible ? snapshot.streamKey : maskSensitiveValue(snapshot.streamKey)}
          action={
            <SecurityActionGroup
              tokenKind="stream_key"
              isVisible={isStreamKeyVisible}
              disabled={disabled}
              onToggleVisible={onToggleVisible}
              onCopy={() => onCopy(snapshot.streamKey)}
            />
          }
        />
      </CardContent>
    </Card>
  );
}

function ObsUrlCard({
  meta,
  snapshot,
  disabled,
  isRotating,
  isUrlVisible,
  onCopy,
  onPreview,
  onToggleVisible,
  onRotate,
}: {
  meta: ChannelSecurityUrlCardMeta;
  snapshot: ChannelSecuritySnapshot;
  disabled: boolean;
  isRotating: boolean;
  isUrlVisible: boolean;
  onCopy: (value: string) => Promise<void>;
  onPreview: (url: string) => void;
  onToggleVisible: (tokenKind: ChannelSecurityTokenKind) => void;
  onRotate: (tokenKind: ChannelSecurityTokenKind, onSuccess?: () => void) => void;
}) {
  const Icon = meta.icon;
  const url =
    meta.tokenKind === "chat_overlay" ? snapshot.chatOverlayUrl : snapshot.donationAlertUrl;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={cn("size-4", meta.accent === "live" ? "text-live" : "text-brand")} />
          {meta.title}
        </CardTitle>
        <CardDescription>{meta.description}</CardDescription>
        <CardAction className="col-start-1 row-start-3 justify-self-start pt-2 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end sm:pt-0">
          <UrlTokenReissueDialog
            title={meta.title}
            tokenKind={meta.tokenKind}
            disabled={disabled}
            isRotating={isRotating}
            onRotate={onRotate}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <SecurityFieldRow
          label={meta.label}
          value={isUrlVisible ? url : maskSensitiveValue(url)}
          action={
            <SecurityActionGroup
              tokenKind={meta.tokenKind}
              isVisible={isUrlVisible}
              disabled={disabled}
              onToggleVisible={onToggleVisible}
              onCopy={() => onCopy(url)}
              onPreview={() => onPreview(url)}
            />
          }
        />
        <SecurityTutorialList items={meta.tutorialItems} />
      </CardContent>
    </Card>
  );
}

function StreamKeyReissueDialog({
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

function UrlTokenReissueDialog({
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
    <AlertDialogContent className="overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-md">
      <AlertDialogHeader className="border-destructive/10 bg-destructive/5 flex items-center gap-4 border-b px-5 pt-5 pb-4 text-left">
        <AlertDialogMedia className="bg-destructive/10 text-destructive ring-destructive/20 mb-0 shrink-0 rounded-xl ring-1">
          <TriangleAlert />
        </AlertDialogMedia>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <AlertDialogTitle className="text-lg leading-tight font-bold">{title}</AlertDialogTitle>
          <AlertDialogDescription className="leading-snug text-pretty">
            {description}
          </AlertDialogDescription>
        </div>
      </AlertDialogHeader>
      <div className="px-5 py-4">
        <div className="border-destructive/15 bg-destructive/5 grid gap-2 rounded-xl border p-3 text-sm">
          {warnings.map((warning) => (
            <span key={warning} className="flex gap-2 leading-5">
              <TriangleAlert className="text-destructive mt-0.5 size-4 shrink-0" />
              {warning}
            </span>
          ))}
        </div>
      </div>
      <AlertDialogFooter className="m-0 flex-row justify-end gap-2 border-0 bg-transparent px-5 pt-0 pb-5">
        <AlertDialogCancel disabled={isRotating} className="h-10 min-w-24">
          취소
        </AlertDialogCancel>
        <AlertDialogAction
          variant="destructive"
          disabled={isRotating}
          className="h-10 min-w-24"
          onClick={onConfirm}
        >
          {isRotating ? <Spinner /> : "새로 발급"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

function SecurityFieldRow({
  label,
  value,
  action,
  className,
}: {
  label: string;
  value: string;
  action: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border bg-muted/40 flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <span className="text-muted-foreground text-xs font-semibold">{label}</span>
        <code className="text-foreground block font-mono text-sm leading-6 break-all select-all">
          {value}
        </code>
      </div>
      {action}
    </div>
  );
}

function SecurityActionGroup({
  tokenKind,
  isVisible,
  disabled,
  onToggleVisible,
  onCopy,
  onPreview,
}: {
  tokenKind: ChannelSecurityTokenKind;
  isVisible: boolean;
  disabled: boolean;
  onToggleVisible: (tokenKind: ChannelSecurityTokenKind) => void;
  onCopy: () => Promise<void>;
  onPreview?: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <Button variant="outline" disabled={disabled} onClick={() => onToggleVisible(tokenKind)}>
        {isVisible ? <EyeOff /> : <Eye />}
        {isVisible ? "숨기기" : "보기"}
      </Button>
      <Button variant="outline" disabled={disabled} onClick={() => void onCopy()}>
        <Copy />
        복사
      </Button>
      {onPreview && (
        <Button variant="outline" disabled={disabled} onClick={onPreview}>
          <ExternalLink />
          미리보기
        </Button>
      )}
    </div>
  );
}

function SecurityTutorialList({ items }: { items: string[] }) {
  return (
    <ul className="border-border/70 text-muted-foreground mt-3 grid gap-1.5 border-t pt-2.5 text-xs leading-5">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="bg-brand mt-2 size-1.5 shrink-0 rounded-full" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SecurityLoadFailedState() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-10 text-center">
      <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-xl">
        <TriangleAlert className="size-6" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-bold">보안 정보를 불러오지 못했습니다.</h1>
        <p className="text-muted-foreground text-sm">
          다시 로그인한 뒤 시도하거나 잠시 후 새로고침해주세요.
        </p>
      </div>
    </main>
  );
}

function maskSensitiveValue(value: string) {
  const maskLength = Math.min(Math.max(value.length, 24), 72);

  return "•".repeat(maskLength);
}
