"use client";
// 수신함 패널: 헤더(알림 + 모두 삭제) + 상대시간 그룹(오늘/최근 일주일/이전) 목록 + 더보기 + 개별 삭제.
import { Fragment, useState } from "react";

import DeleteConfirmDialog from "@/components/common/delete-confirm-dialog";
import NotificationItem from "@/components/notification/notification-item";
import { Spinner } from "@/components/ui/spinner";
import {
  useDeleteAllNotifications,
  useDeleteNotification,
} from "@/hooks/notification/use-delete-notifications";
import { useNotifications } from "@/hooks/notification/use-notifications";
import type { AppNotification } from "@/types/notification/notification";
import { formatNotificationGroupLabel } from "@/utils/common/format";

export default function NotificationInbox({ onNavigate }: { onNavigate: () => void }) {
  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotifications(true);
  const deleteAll = useDeleteAllNotifications();
  const deleteOne = useDeleteNotification();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const items: AppNotification[] = data?.pages.flat() ?? [];

  const handleDeleteAll = () => {
    deleteAll.mutate(undefined, {
      onSuccess: (result) => {
        if (result.success) setConfirmOpen(false);
      },
    });
  };

  const renderBody = () => {
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
      <div className="flex max-h-112 flex-col overflow-y-auto p-1">
        {items.map((item, index) => {
          const label = formatNotificationGroupLabel(item.createdAt);
          // 직전 아이템과 그룹 라벨이 다를 때(또는 첫 아이템)만 그룹 헤더를 노출합니다.
          const prevLabel =
            index > 0 ? formatNotificationGroupLabel(items[index - 1].createdAt) : null;
          const showLabel = label !== prevLabel;
          return (
            <Fragment key={item.id}>
              {showLabel && (
                <p className="text-muted-foreground px-3 pt-3 pb-1 text-xs font-bold">{label}</p>
              )}
              <NotificationItem
                notification={item}
                onNavigate={onNavigate}
                onDelete={(id) => deleteOne.mutate(id)}
              />
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
  };

  return (
    <div className="flex flex-col">
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <span className="text-foreground text-sm font-bold">알림</span>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="text-muted-foreground hover:text-foreground text-xs font-semibold"
          >
            모두 삭제
          </button>
        )}
      </div>

      {renderBody()}

      <DeleteConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="알림 전체 삭제"
        description={"받은 알림을 모두 삭제할까요?\n삭제한 알림은 되돌릴 수 없어요."}
        isPending={deleteAll.isPending}
        onConfirm={handleDeleteAll}
        confirmLabel="모두 삭제"
      />
    </div>
  );
}
