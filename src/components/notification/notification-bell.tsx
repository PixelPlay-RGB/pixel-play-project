"use client";
// 헤더 종 아이콘 + 안읽음 빨간 점 + 수신함 드롭다운(Popover). 로그인 시에만 노출.
import { useState } from "react";
import { Bell } from "lucide-react";

import NotificationInbox from "@/components/notification/notification-inbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMarkNotificationsSeen } from "@/hooks/notification/use-mark-notifications-seen";
import { useNotificationBadge } from "@/hooks/notification/use-notification-badge";
import { cn } from "@/lib/utils";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { unreadCount, isLoggedIn } = useNotificationBadge();
  const markSeen = useMarkNotificationsSeen();

  if (!isLoggedIn) return null;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    // 수신함을 열 때 안읽음이 있으면 방문 기준 읽음 처리(배지 0).
    if (next && unreadCount > 0) markSeen.mutate();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        type="button"
        aria-label="알림"
        className={cn(
          "relative grid size-10 place-items-center rounded-md border border-transparent bg-transparent",
          "cursor-pointer",
          "text-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
          "transition-all duration-200",
        )}
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="bg-live ring-background absolute top-2 right-2 size-2 rounded-full ring-2" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-88 gap-0 p-0">
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <span className="text-foreground text-sm font-bold">알림</span>
        </div>
        <NotificationInbox onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
