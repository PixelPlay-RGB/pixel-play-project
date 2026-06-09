// 사이드바·팝오버 상단에 표시하는 신원 카드(아바타 + 배지 + 제목)를 렌더링합니다.
// 헤더 계정 팝오버(UserCard), 유저 설정 사이드바(UserCard), 채널 관리 사이드바(ChannelCard)에서 공용으로 사용합니다.

import Link from "next/link";

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
        "route-accent-surface flex items-center gap-3 rounded-lg border p-3",
        className,
      )}
    >
      <Avatar className="route-accent-border h-11 w-11 border">
        <AvatarImage src={avatarSrc} alt={avatarAlt} />
        <AvatarFallback>{fallbackText}</AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-col gap-1">
        <span className="route-accent-badge w-fit rounded-md px-1.5 py-0.5 text-xs font-black">
          {badgeLabel}
        </span>
        <span className="text-foreground truncate text-base leading-tight font-black">{title}</span>
      </div>
    </Link>
  );
}
