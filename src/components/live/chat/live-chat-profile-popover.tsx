"use client";
// 채팅 닉네임 클릭 팝업 — 공통 카드(치지직식: 아바타 + 닉네임/뱃지 헤더, full-width 팔로우 정보 줄,
// 하단 액션)로 권한에 따라 채널 이동 / 매니저 임명·해제 / 강퇴를 노출한다.
// 본인 닉네임은 트리거를 클릭 불가 평문으로 렌더한다(자기 자신 팝오버는 열리지 않는다, #127).
// 강퇴·매니저 노출은 메시지 스냅샷이 아니라 대상의 "현재" 역할(profile.role)로 판정한다.

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Ban, Heart, ShieldCheck, ShieldOff, Tv, UserX } from "lucide-react";

import { DestructiveAlertDialog } from "@/components/common/destructive-alert-dialog";
import CreatorFollowingButton from "@/components/following/creator-following-button";
import { LiveChatRoleBadge, type LiveChatRole } from "@/components/live/chat/live-chat-role-badge";
import { UserProfilePopoverCard } from "@/components/user/user-profile-popover-card";
import { AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { useBanChannelViewer } from "@/hooks/channel/use-ban-channel-viewer";
import { useChannelManagers } from "@/hooks/channel/use-channel-managers";
import { useToggleCreatorFollowing } from "@/hooks/following/use-toggle-creator-following";
import { useLiveViewerProfile } from "@/hooks/live/use-live-viewer-profile";
import { useMoveToLogin } from "@/hooks/live/use-move-to-login";
import { useViewerFollowStatus } from "@/hooks/live/use-viewer-follow-status";
import { cn } from "@/lib/utils";
import type { LiveChatProfileContext } from "@/types/live/live";
import { formatKstDateKorean } from "@/utils/common/date";

interface Props {
  context: LiveChatProfileContext;
  targetUserId: string;
  // 메시지 스냅샷 닉네임 — 프로필 로딩 전/실패 시 표시에 쓴다.
  fallbackNickname: string;
  nicknameColor: string;
  // 닉네임 아래 역할 뱃지 — 채팅 라인의 senderRoles 를 그대로 받아 카드 헤더를 채팅과 일치시킨다.
  senderRoles?: LiveChatRole[];
}

export function LiveChatProfilePopover({
  context,
  targetUserId,
  fallbackNickname,
  nicknameColor,
  senderRoles = [],
}: Props) {
  const { creatorId, viewerId, canModerate, broadcastId } = context;
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isBanConfirmOpen, setIsBanConfirmOpen] = useState(false);

  const moveToLogin = useMoveToLogin();
  const { profile, isLoading } = useLiveViewerProfile(creatorId, targetUserId, isOpen);
  const { ban, isBanning } = useBanChannelViewer(creatorId);
  // 매니저 임명/해제 — 목록 조회는 끄고 mutation 만 쓴다(채널 주인일 때만 실제 호출된다).
  const { addManager, isAdding, removeManager, isRemoving } = useChannelManagers(creatorId, {
    listEnabled: false,
  });

  const isLoggedIn = Boolean(viewerId);
  const isSelf = targetUserId === viewerId;
  // 채널 주인 본인만 매니저를 임명/해제할 수 있다(매니저는 다른 매니저를 만들지 못한다).
  const isOwner = isLoggedIn && viewerId === creatorId;

  // 강퇴/매니저 노출은 대상의 "현재" 역할로 판정한다.
  const role = profile?.role;
  const canBan = canModerate && !isSelf && role === "viewer";
  const canAppointManager = isOwner && !isSelf && role === "viewer";
  const canDismissManager = isOwner && role === "manager";

  const { isFollowing, isLoading: isFollowStatusLoading } = useViewerFollowStatus(
    viewerId,
    targetUserId,
    isOpen && !isSelf,
  );
  const toggleFollowing = useToggleCreatorFollowing();
  const isFollowPending =
    toggleFollowing.isPending && toggleFollowing.variables?.creatorId === targetUserId;

  const displayNickname = profile?.nickname ?? fallbackNickname;
  // 팔로우 정보 줄은 프로필·팔로우 상태가 모두 확정된 뒤에만 그린다(로딩 중 깜빡임/오방향 방지).
  const isFollowInfoReady = !isLoading && !isFollowStatusLoading;

  function handleFollow() {
    if (!isLoggedIn) {
      setIsOpen(false);
      moveToLogin();
      return;
    }
    // 팔로우 상태가 아직 안 들어왔으면(방향을 알 수 없으면) 무시한다.
    if (isFollowPending || isFollowStatusLoading) return;
    toggleFollowing.mutate({ creatorId: targetUserId, nextFollowing: !isFollowing });
  }

  // 매니저 임명/해제는 토글이라 즉시 실행한다 — 성공 시 프로필을 무효화해 버튼이 임명↔해제로 뒤집힌다.
  async function handleAppointManager() {
    if (isAdding) return;
    const ok = await addManager(targetUserId);
    if (ok) {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.live.viewerProfile(creatorId, targetUserId),
      });
    }
  }

  async function handleDismissManager() {
    if (isRemoving) return;
    const ok = await removeManager(targetUserId);
    if (ok) {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.live.viewerProfile(creatorId, targetUserId),
      });
    }
  }

  function openBanConfirm() {
    setIsOpen(false);
    setIsBanConfirmOpen(true);
  }

  async function handleConfirmBan() {
    const success = await ban(targetUserId, broadcastId ?? undefined);
    if (success) {
      setIsBanConfirmOpen(false);
    }
  }

  // 본인 닉네임은 클릭 불가 — 팝오버를 열지 않고 채팅 라인과 같은 평문으로 렌더한다.
  if (isSelf) {
    return (
      <span className="mr-1.5 align-middle font-medium" style={{ color: nicknameColor }}>
        {fallbackNickname}
      </span>
    );
  }

  const hasModerationRow = canAppointManager || canDismissManager || canBan;

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          type="button"
          aria-label={`${fallbackNickname} 프로필 열기`}
          className="mr-1.5 cursor-pointer align-middle font-medium hover:underline"
          style={{ color: nicknameColor }}
        >
          {fallbackNickname}
        </PopoverTrigger>

        <PopoverContent className="w-72 gap-0 overflow-hidden p-0" align="start" sideOffset={6}>
          <UserProfilePopoverCard
            nickname={displayNickname}
            photoUrl={profile?.photoUrl ?? null}
            subHeader={
              senderRoles.length > 0
                ? senderRoles.map((badgeRole) => (
                    <LiveChatRoleBadge key={badgeRole} role={badgeRole} withTooltip />
                  ))
                : undefined
            }
            headerAction={
              <CreatorFollowingButton
                creatorNickname={displayNickname}
                isFollowing={isFollowing}
                isOwnChannel={false}
                isPending={isFollowPending || isFollowStatusLoading}
                onClick={handleFollow}
              />
            }
            infoRows={
              isFollowInfoReady && isFollowing ? (
                <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                  <Heart className="text-brand size-3.5 shrink-0 fill-current" />
                  <span>
                    {profile?.followedAt
                      ? `${formatKstDateKorean(profile.followedAt)}부터 팔로우`
                      : "팔로잉 중"}
                  </span>
                </div>
              ) : undefined
            }
          >
            <Link
              href={`/channel/${targetUserId}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8 w-full min-w-0 justify-center gap-1.5 rounded-full px-3 text-xs font-bold",
              )}
              onClick={() => setIsOpen(false)}
            >
              <Tv className="size-3.5" />
              채널 보기
            </Link>

            {hasModerationRow ? (
              <div className="flex gap-2">
                {canAppointManager ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isAdding}
                    onClick={handleAppointManager}
                    className="h-8 min-w-0 flex-1 justify-center gap-1.5 rounded-full px-3 text-xs font-bold"
                  >
                    {isAdding ? (
                      <Spinner className="size-3.5" />
                    ) : (
                      <ShieldCheck className="size-3.5" />
                    )}
                    매니저 임명
                  </Button>
                ) : null}

                {canDismissManager ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isRemoving}
                    onClick={handleDismissManager}
                    className="h-8 min-w-0 flex-1 justify-center gap-1.5 rounded-full px-3 text-xs font-bold"
                  >
                    {isRemoving ? (
                      <Spinner className="size-3.5" />
                    ) : (
                      <ShieldOff className="size-3.5" />
                    )}
                    매니저 해제
                  </Button>
                ) : null}

                {canBan ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={openBanConfirm}
                    className="h-8 min-w-0 flex-1 justify-center gap-1.5 rounded-full px-3 text-xs font-bold"
                  >
                    <UserX className="size-3.5" />
                    강퇴하기
                  </Button>
                ) : null}
              </div>
            ) : null}
          </UserProfilePopoverCard>
        </PopoverContent>
      </Popover>

      <DestructiveAlertDialog
        open={isBanConfirmOpen}
        onOpenChange={(open) => {
          if (!isBanning && !open) setIsBanConfirmOpen(false);
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
