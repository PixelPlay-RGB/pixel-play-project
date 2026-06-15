"use client";
// 채팅 닉네임 클릭 팝업 — 아바타·닉네임·이 채널 팔로우 시작일 + 채널 보기/신고/강퇴 버튼.
// 일반 시청자에겐 [채널 보기][신고]만, 강퇴 권한자(크리에이터/매니저)에겐 대상이 일반 시청자일 때 [강퇴]를 추가한다.
// 프로필은 팝업이 열렸을 때만 조회하고, 강퇴 가드(대상 역할)는 메시지 스냅샷이 아니라 현재 역할(profile.role)로 판정한다.

import { useState } from "react";

import Link from "next/link";
import { Ban, Flag, Tv, UserX } from "lucide-react";

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
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { useBanChannelViewer } from "@/hooks/channel/use-ban-channel-viewer";
import { useLiveViewerProfile } from "@/hooks/live/use-live-viewer-profile";
import { cn } from "@/lib/utils";
import type { LiveChatProfileContext } from "@/types/live/live";
import { formatKstDateTimeNumeric } from "@/utils/common/date";
import { toastAppInfo } from "@/utils/common/toast-message";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface Props {
  context: LiveChatProfileContext;
  targetUserId: string;
  // 메시지 스냅샷 닉네임 — 프로필 로딩 전/실패 시 표시에 쓴다.
  fallbackNickname: string;
  nicknameColor: string;
}

export function LiveChatProfilePopover({
  context,
  targetUserId,
  fallbackNickname,
  nicknameColor,
}: Props) {
  const { creatorId, viewerId, canModerate, broadcastId } = context;
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { profile, isLoading } = useLiveViewerProfile(creatorId, targetUserId, isOpen);
  const { ban, isBanning } = useBanChannelViewer(creatorId);

  const displayNickname = profile?.nickname ?? fallbackNickname;
  // 강퇴 버튼은 권한자이면서 대상이 "현재" 일반 시청자이고 본인이 아닐 때만 노출한다.
  const canBan =
    canModerate && targetUserId !== viewerId && (profile ? profile.role === "viewer" : false);

  function handleReport() {
    setIsOpen(false);
    toastAppInfo(APP_MESSAGE_CODE.info.common.featureNotReady);
  }

  function openBanConfirm() {
    setIsOpen(false);
    setIsConfirmOpen(true);
  }

  async function handleConfirmBan() {
    const success = await ban(targetUserId, broadcastId ?? undefined);
    if (success) {
      setIsConfirmOpen(false);
    }
  }

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          type="button"
          aria-label={`${fallbackNickname} 프로필 열기`}
          className="mr-1.5 cursor-pointer font-medium hover:underline"
          style={{ color: nicknameColor }}
        >
          {fallbackNickname}
        </PopoverTrigger>

        <PopoverContent className="w-64 gap-0 overflow-hidden p-0" align="start" sideOffset={6}>
          <div className="flex min-w-0 items-center gap-3 px-4 pt-4 pb-3.5">
            <Avatar className="size-11 shrink-0" size="lg">
              <AvatarImage
                src={getAvatarImageSrc(profile?.photoUrl ?? null)}
                alt={`${displayNickname} 프로필 이미지`}
              />
              <AvatarFallback>{getAvatarFallbackText(displayNickname)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm font-black">{displayNickname}</p>
              <p className="text-muted-foreground mt-1 truncate text-xs font-medium">
                {isLoading
                  ? "불러오는 중…"
                  : profile?.followedAt
                    ? `팔로우 ${formatKstDateTimeNumeric(profile.followedAt)}`
                    : "팔로우 안 함"}
              </p>
            </div>
          </div>

          <div className="border-border/60 bg-muted/30 flex flex-col gap-2 border-t px-3 py-3">
            <div className="flex items-center gap-2">
              <Link
                href={`/channel/${targetUserId}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-8 flex-1 justify-center gap-1.5 rounded-full px-3 text-xs font-bold",
                )}
                onClick={() => setIsOpen(false)}
              >
                <Tv className="size-3.5" />
                채널 보기
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-8 flex-1 justify-center gap-1.5 rounded-full px-3 text-xs font-bold"
                onClick={handleReport}
              >
                <Flag className="size-3.5" />
                신고하기
              </Button>
            </div>
            {canBan && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-8 w-full justify-center gap-1.5 rounded-full px-3 text-xs font-bold"
                onClick={openBanConfirm}
              >
                <UserX className="size-3.5" />
                강퇴하기
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          if (!isBanning && !open) setIsConfirmOpen(false);
        }}
      >
        <AlertDialogContent
          showCloseButton={false}
          className="border-destructive/20 shadow-destructive/10 overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-lg"
        >
          <AlertDialogHeader className="bg-destructive/5 border-destructive/10 flex items-center gap-4 border-b px-5 pt-5 pb-4 text-left">
            <AlertDialogMedia className="bg-destructive/10 text-destructive ring-destructive/20 mb-0 shrink-0 rounded-xl ring-1">
              <Ban />
            </AlertDialogMedia>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <AlertDialogTitle className="text-lg leading-tight font-bold">
                시청자 강퇴
              </AlertDialogTitle>
              <AlertDialogDescription className="leading-snug text-pretty whitespace-pre-line">
                {`${displayNickname} 님을 이 채널에서 강퇴할까요?\n강퇴하면 채널 전체에서 채팅과 입장이 영구 차단됩니다.`}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="m-0 flex-row justify-end gap-2 border-0 bg-transparent px-5 pt-4 pb-5">
            <AlertDialogCancel
              disabled={isBanning}
              className="border-border bg-background text-foreground hover:bg-muted h-10 min-w-24 rounded-xl px-4 font-semibold"
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              type="button"
              disabled={isBanning}
              onClick={handleConfirmBan}
              className="shadow-destructive/10 h-10 min-w-24 rounded-xl px-4 font-bold shadow-sm"
            >
              {isBanning ? <Spinner className="size-4" /> : "강퇴"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
