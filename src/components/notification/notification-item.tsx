"use client";
// 알림 단건: 아바타 + 제목 + 본문 + 상대시간. 클릭 시 link_path로 이동.
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AppNotification } from "@/types/notification/notification";
import { formatRelativeTime } from "@/utils/common/format";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface Props {
  notification: AppNotification;
  onNavigate: () => void;
}

export default function NotificationItem({ notification, onNavigate }: Props) {
  const nickname = notification.actorNickname ?? "크리에이터";

  return (
    <Link
      href={notification.linkPath}
      onClick={onNavigate}
      className="hover:bg-muted/60 flex gap-3 rounded-xl px-3 py-2.5 transition-colors"
    >
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={getAvatarImageSrc(notification.actorPhotoUrl)} alt={nickname} />
        <AvatarFallback className="text-xs font-black">
          {getAvatarFallbackText(nickname, 1)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-bold">{notification.title}</p>
        {notification.body && (
          <p className="text-muted-foreground line-clamp-1 text-xs">{notification.body}</p>
        )}
        <p className="text-muted-foreground/70 mt-0.5 text-xs">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </Link>
  );
}
