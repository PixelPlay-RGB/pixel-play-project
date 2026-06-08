"use client";
// 수신함 패널: 알림을 상대시간 그룹(오늘/최근 일주일/이전)으로 묶어 보여주고 더보기로 추가 로드.
import { Fragment } from "react";

import NotificationItem from "@/components/notification/notification-item";
import { Spinner } from "@/components/ui/spinner";
import { useNotifications } from "@/hooks/notification/use-notifications";
import type { AppNotification } from "@/types/notification/notification";

const DAY_MS = 24 * 60 * 60 * 1000;

function groupLabel(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < DAY_MS) return "오늘";
  if (diff < 7 * DAY_MS) return "최근 일주일";
  return "이전";
}

export default function NotificationInbox({ onNavigate }: { onNavigate: () => void }) {
  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotifications(true);
  const items: AppNotification[] = data?.pages.flat() ?? [];

  if (isPending) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm font-semibold">
        아직 받은 알림이 없어요.
      </p>
    );
  }

  return (
    <div className="flex max-h-[28rem] flex-col overflow-y-auto p-1">
      {items.map((item, index) => {
        const label = groupLabel(item.createdAt);
        // 직전 아이템과 그룹 라벨이 다를 때(또는 첫 아이템)만 그룹 헤더를 노출합니다.
        const prevLabel = index > 0 ? groupLabel(items[index - 1].createdAt) : null;
        const showLabel = label !== prevLabel;
        return (
          <Fragment key={item.id}>
            {showLabel && (
              <p className="text-muted-foreground px-3 pt-3 pb-1 text-xs font-bold">{label}</p>
            )}
            <NotificationItem notification={item} onNavigate={onNavigate} />
          </Fragment>
        );
      })}
      {hasNextPage && (
        <button
          type="button"
          onClick={() => void fetchNextPage()}
          disabled={isFetchingNextPage}
          className="text-muted-foreground hover:text-foreground py-2 text-center text-xs font-semibold"
        >
          {isFetchingNextPage ? "불러오는 중…" : "더보기"}
        </button>
      )}
    </div>
  );
}
