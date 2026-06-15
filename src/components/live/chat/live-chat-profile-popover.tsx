"use client";
// 채팅 닉네임 클릭 팝업 — 아바타·닉네임·이 채널 팔로우 시작일 + 채널 보기 / (강퇴 또는 팔로우) 버튼.
// 강퇴 권한자(크리에이터/매니저)가 일반 시청자를 볼 때만 [채널 보기][강퇴], 그 외(일반 시청자가 보거나
// 권한자가 스트리머/매니저/본인을 볼 때)엔 [채널 보기][팔로우]. 강퇴 가드는 메시지 스냅샷이 아니라
// 현재 역할(profile.role)로 판정하고, 권한자는 역할 확정 전까지 두 번째 버튼을 비워 깜빡임을 막는다.

import { useState } from "react";

import Link from "next/link";
import { Ban, Tv, UserX } from "lucide-react";

import { DestructiveAlertDialog } from "@/components/common/destructive-alert-dialog";
import CreatorFollowingButton from "@/components/following/creator-following-button";
import { AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { useBanChannelViewer } from "@/hooks/channel/use-ban-channel-viewer";
import { useToggleCreatorFollowing } from "@/hooks/following/use-toggle-creator-following";
import { useLiveViewerProfile } from "@/hooks/live/use-live-viewer-profile";
import { useMoveToLogin } from "@/hooks/live/use-move-to-login";
import { useViewerFollowStatus } from "@/hooks/live/use-viewer-follow-status";
import { cn } from "@/lib/utils";
import type { LiveChatProfileContext } from "@/types/live/live";
import { formatKstDateTimeNumeric } from "@/utils/common/date";
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

  const moveToLogin = useMoveToLogin();
  const { profile, isLoading } = useLiveViewerProfile(creatorId, targetUserId, isOpen);
  const { ban, isBanning } = useBanChannelViewer(creatorId);

  const isLoggedIn = Boolean(viewerId);
  const isSelf = targetUserId === viewerId;

  // 강퇴 버튼은 권한자이면서 대상이 "현재" 일반 시청자이고 본인이 아닐 때만 노출한다.
  const canBan = canModerate && !isSelf && profile?.role === "viewer";
  // 팔로우 버튼은 강퇴를 노출하지 않는 모든 경우. 단 권한자는 역할 확정 전엔 강퇴/팔로우가 뒤바뀔 수 있어,
  // 프로필 조회가 "끝난" 뒤에만 그린다(로딩 중에만 빈 슬롯). 에러로 역할 미확정이어도 팔로우로 폴백한다.
  const showFollow = canModerate ? !canBan && !isLoading : true;

  // 팔로우 상태가 로딩되기 전엔 isFollowing 이 기본 false 라, 그 사이 클릭하면 토글 방향이 반대로
  // 나갈 수 있다(이미 팔로우 중인데 다시 팔로우). 로딩 동안 버튼을 비활성화해 막는다.
  const { isFollowing, isLoading: isFollowStatusLoading } = useViewerFollowStatus(
    viewerId,
    targetUserId,
    isOpen && showFollow && !isSelf,
  );
  const toggleFollowing = useToggleCreatorFollowing();
  const isFollowPending =
    toggleFollowing.isPending && toggleFollowing.variables?.creatorId === targetUserId;

  const displayNickname = profile?.nickname ?? fallbackNickname;

  function handleFollow() {
    if (!isLoggedIn) {
      setIsOpen(false);
      moveToLogin();
      return;
    }
    // 팔로우 상태가 아직 안 들어왔으면(방향을 알 수 없으면) 무시한다.
    if (isFollowPending || isFollowStatusLoading) return;
    // viewerFollowStatus 는 QUERY_KEYS.live.all 하위라, 토글 onSettled 의 live.all 무효화로 함께 갱신된다.
    toggleFollowing.mutate({ creatorId: targetUserId, nextFollowing: !isFollowing });
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

          <div className="border-border/60 bg-muted/30 flex items-center gap-2 border-t px-3 py-3">
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

            {canBan ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-8 flex-1 justify-center gap-1.5 rounded-full px-3 text-xs font-bold"
                onClick={openBanConfirm}
              >
                <UserX className="size-3.5" />
                강퇴하기
              </Button>
            ) : showFollow ? (
              <div className="flex-1">
                <CreatorFollowingButton
                  creatorNickname={displayNickname}
                  isFollowing={isFollowing}
                  isOwnChannel={isSelf}
                  // 팔로우 상태 로딩 중에도 비활성화해 방향이 정해지기 전 클릭을 막는다.
                  isPending={isFollowPending || isFollowStatusLoading}
                  onClick={handleFollow}
                  className="w-full"
                />
              </div>
            ) : (
              // 권한자 역할 로딩 중 — 자리만 유지해 강퇴/팔로우 버튼이 뒤늦게 끼어드는 깜빡임을 막는다.
              <div className="flex-1" />
            )}
          </div>
        </PopoverContent>
      </Popover>

      <DestructiveAlertDialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          if (!isBanning && !open) setIsConfirmOpen(false);
        }}
        icon={<Ban />}
        title="시청자 강퇴"
        description={`${displayNickname} 님을 이 채널에서 강퇴할까요?\n강퇴하면 채널 전체에서 채팅과 입장이 영구 차단됩니다.`}
        descriptionClassName="whitespace-pre-line"
        footerClassName="flex-row gap-2"
      >
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
      </DestructiveAlertDialog>
    </>
  );
}
