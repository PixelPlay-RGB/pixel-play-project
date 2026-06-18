// 사이드바·팝오버 상단에 표시하는 신원 카드(아바타 + 이름 + 라벨)를 렌더링합니다.
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
        "group/identity relative flex items-center gap-3.5 overflow-hidden rounded-xl border py-4 pr-4 pl-5 transition-all duration-200",
        "border-border/60 bg-card/40",
        "hover:border-brand/35 hover:bg-brand/5",
        className,
      )}
    >
      <span
        className="bg-brand/70 group-hover/identity:bg-brand absolute inset-y-0 left-0 w-1.5 transition-colors"
        aria-hidden
      />

      <Avatar className="size-12 shrink-0">
        <AvatarImage src={avatarSrc} alt={avatarAlt} />
        <AvatarFallback className="bg-brand/15 text-brand text-base font-black">
          {fallbackText}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-brand text-2xs font-extrabold tracking-wide uppercase">
          {badgeLabel}
        </span>
        <span className="text-foreground truncate text-sm leading-tight font-bold">{title}</span>
      </div>

      <ChevronRight
        className="text-muted-foreground group-hover/identity:text-brand ml-auto size-4 shrink-0 transition-colors"
        aria-hidden
      />
    </Link>
  );
}
