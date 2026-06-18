"use client";
// 유저 프로필 팝오버 공통 카드 — 치지직식 레이아웃: [아바타 + 닉네임 / 뱃지] 헤더, 그 아래
// full-width 정보 줄(팔로우 날짜 등, 잘리지 않음), 하단 액션 영역. 채팅 닉네임 팝오버와
// 크리에이터 아바타 팝오버가 같은 외형을 공유한다(디자인 단일화).
// 데이터 조달·권한 판정·트리거는 각 팝오버가 담당하고, 이 카드는 순수 표현만 책임진다.

import type { ReactNode } from "react";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface Props {
  nickname: string;
  photoUrl: string | null;
  // 닉네임 아래 줄 — 역할 뱃지(채팅) 또는 상태 텍스트("지금 라이브 중"/"내 채널").
  subHeader?: ReactNode;
  // 헤더 우측 액션(팔로우 버튼) — headerHref 와 함께 쓰지 않는다.
  headerAction?: ReactNode;
  // 헤더 아래 full-width 정보 줄(팔로우 날짜 등) — 좁은 헤더가 아니라 카드 폭이라 잘리지 않는다.
  // headerHref(헤더 전체 링크) 모드에서는 무시한다.
  infoRows?: ReactNode;
  // 지정 시 헤더 행 전체가 이 경로로 가는 링크가 된다(아바타 팝오버의 라이브 시청 진입).
  headerHref?: string;
  headerHrefLabel?: string;
  liveRing?: boolean;
  onHeaderNavigate?: () => void;
  // 하단 액션 버튼 영역. 없으면 영역을 그리지 않는다.
  children?: ReactNode;
}

export function UserProfilePopoverCard({
  nickname,
  photoUrl,
  subHeader,
  headerAction,
  infoRows,
  headerHref,
  headerHrefLabel,
  liveRing = false,
  onHeaderNavigate,
  children,
}: Props) {
  const avatarSrc = getAvatarImageSrc(photoUrl);
  const fallbackText = getAvatarFallbackText(nickname);

  const headerRow = (
    <>
      <Avatar className={cn("size-12 shrink-0", liveRing && "ring-live/80 ring-2")} size="lg">
        <AvatarImage src={avatarSrc} alt={`${nickname} 프로필 이미지`} />
        <AvatarFallback>{fallbackText}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        {/* 닉네임 줄 — 닉네임(가변)과 팔로우/이동 표시(고정)를 같은 줄에 정렬한다. */}
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-foreground min-w-0 flex-1 truncate text-sm font-black",
              headerHref && "group-hover/header:text-brand transition-colors",
            )}
          >
            {nickname}
          </p>
          {headerHref ? (
            <ChevronRight className="text-muted-foreground/70 group-hover/header:text-brand size-4 shrink-0 transition-all group-hover/header:translate-x-0.5" />
          ) : headerAction ? (
            <div className="shrink-0">{headerAction}</div>
          ) : null}
        </div>
        {subHeader ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">{subHeader}</div>
        ) : null}
      </div>
    </>
  );

  return (
    <div className="w-full">
      {headerHref ? (
        <Link
          href={headerHref}
          aria-label={headerHrefLabel}
          onClick={onHeaderNavigate}
          className="group/header hover:bg-muted/50 flex items-center gap-3 px-4 pt-4 pb-3.5 transition-colors"
        >
          {headerRow}
        </Link>
      ) : (
        <div className="px-4 pt-4 pb-3.5">
          <div className="flex items-center gap-3">{headerRow}</div>
          {infoRows ? <div className="mt-3 flex flex-col gap-1.5">{infoRows}</div> : null}
        </div>
      )}

      {children ? (
        <div className="border-border/60 bg-muted/30 flex flex-col gap-2 border-t px-3 py-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}
