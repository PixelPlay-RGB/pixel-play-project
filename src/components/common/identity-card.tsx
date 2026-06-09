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
        "route-accent-surface group/identity flex items-center gap-3 rounded-xl border p-3",
        "shadow-sm transition-all hover:-translate-y-px hover:shadow-md",
        className,
      )}
    >
      <Avatar className="route-accent-border size-12 border-2 shadow-sm">
        <AvatarImage src={avatarSrc} alt={avatarAlt} />
        <AvatarFallback className="font-black">{fallbackText}</AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-col gap-1">
        <span className="route-accent-badge w-fit rounded-md px-1.5 py-0.5 text-[11px] font-black tracking-wide">
          {badgeLabel}
        </span>
        <span className="text-foreground truncate text-[15px] leading-tight font-black">
          {title}
        </span>
      </div>

      <ChevronRight
        className="text-muted-foreground/40 group-hover/identity:text-muted-foreground ml-auto size-4 shrink-0 transition-transform group-hover/identity:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
