// 사이드바·팝오버 상단에 표시하는 신원 카드(아바타 + 배지 + 제목)를 렌더링합니다.
// 헤더 계정 팝오버(UserCard), 유저 설정 사이드바(UserCard), 채널 관리 사이드바(ChannelCard)에서 공용으로 사용합니다.

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface IdentityCardProps {
  href: string;
  avatarSrc: string;
  avatarAlt: string;
  fallbackText: string;
  badgeLabel: string;
  title: string;
  onClick?: () => void;
  className?: string;
}

export default function IdentityCard({
  href,
  avatarSrc,
  avatarAlt,
  fallbackText,
  badgeLabel,
  title,
  onClick,
  className,
}: IdentityCardProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group/identity relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3.5",
        "border-brand/20 from-brand/12 via-card to-card bg-gradient-to-br",
        "shadow-sm transition-all hover:border-brand/45 hover:shadow-md hover:shadow-brand/10",
        "dark:border-brand/25 dark:from-brand/18 dark:via-card dark:to-card",
        className,
      )}
    >
      {/* 우상단 코너 글로우 */}
      <span
        className="bg-brand/20 pointer-events-none absolute -top-10 -right-10 size-24 rounded-full blur-2xl transition-opacity group-hover/identity:opacity-70"
        aria-hidden
      />

      <Avatar className="ring-brand/35 size-12 shrink-0 shadow-sm ring-2">
        <AvatarImage src={avatarSrc} alt={avatarAlt} />
        <AvatarFallback className="bg-brand/10 text-brand font-black">{fallbackText}</AvatarFallback>
      </Avatar>

      <div className="relative flex min-w-0 flex-col gap-1">
        <span className="bg-brand/15 text-brand w-fit rounded-full px-2 py-0.5 text-[11px] font-black tracking-wide">
          {badgeLabel}
        </span>
        <span className="text-foreground truncate text-[15px] leading-tight font-black">
          {title}
        </span>
      </div>

      <ChevronRight
        className="text-brand/50 group-hover/identity:text-brand relative ml-auto size-4 shrink-0 transition-transform group-hover/identity:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
