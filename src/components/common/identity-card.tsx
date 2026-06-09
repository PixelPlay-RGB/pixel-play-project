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
        "group/identity flex items-center gap-3 rounded-xl border p-3 transition-colors",
        "border-brand/20 bg-brand/5 hover:border-brand/40 hover:bg-brand/10",
        "dark:bg-brand/10 dark:hover:bg-brand/15",
        className,
      )}
    >
      <Avatar className="ring-brand/30 size-11 shrink-0 ring-2">
        <AvatarImage src={avatarSrc} alt={avatarAlt} />
        <AvatarFallback className="bg-brand/10 text-brand font-black">{fallbackText}</AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-col gap-1">
        <span className="bg-brand/10 text-brand w-fit rounded-md px-1.5 py-0.5 text-[11px] font-black tracking-wide">
          {badgeLabel}
        </span>
        <span className="text-foreground truncate text-sm font-bold">{title}</span>
      </div>

      <ChevronRight
        className="text-brand/40 group-hover/identity:text-brand ml-auto size-4 shrink-0 transition-colors"
        aria-hidden
      />
    </Link>
  );
}
