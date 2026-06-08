"use client";
// 알림 삭제 mutation(전체/개별). 전체 재요청 없이 목록 캐시를 직접 갱신하고 안읽음 수만 무효화합니다.
import { type InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  deleteAllNotificationsAction,
  deleteNotificationAction,
} from "@/actions/notification/notification";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { useAuthStore } from "@/stores/auth";
import type { AppActionResult } from "@/types/common/action";
import type { AppNotification } from "@/types/notification/notification";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

type NotificationPages = InfiniteData<AppNotification[]>;

// 전체 삭제: 확인 다이얼로그를 거치므로 성공 토스트로 결과를 알린다.
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<AppActionResult, Error, void>({
    mutationFn: () => deleteAllNotificationsAction(),
    onSuccess: (result) => {
      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.notification.deleteFailed);
        return;
      }
      toastAppSuccess(APP_MESSAGE_CODE.success.notification.allDeleted);
      // 결과가 빈 목록으로 확정적이므로 재요청 없이 캐시를 비운다.
      queryClient.setQueryData<NotificationPages>(QUERY_KEYS.notification.list(userId), (data) =>
        data ? { ...data, pages: [[]], pageParams: data.pageParams.slice(0, 1) } : data,
      );
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notification.unreadCountAll(userId),
      });
    },
    onError: (error) => {
      console.error("알림 전체 삭제 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.notification.deleteFailed);
    },
  });
}

// 개별 삭제: 성공 시 해당 한 건만 캐시에서 제거해 즉시 사라지게 한다(전체 재요청 없음).
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<AppActionResult, Error, string>({
    mutationFn: (notificationId: string) => deleteNotificationAction(notificationId),
    onSuccess: (result, notificationId) => {
      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.notification.deleteFailed);
        return;
      }
      queryClient.setQueryData<NotificationPages>(QUERY_KEYS.notification.list(userId), (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => page.filter((item) => item.id !== notificationId)),
            }
          : data,
      );
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notification.unreadCountAll(userId),
      });
    },
    onError: (error) => {
      console.error("알림 삭제 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.notification.deleteFailed);
    },
  });
}
