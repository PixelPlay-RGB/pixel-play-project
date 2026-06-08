"use client";
// 알림 삭제 mutation(전체/개별). 성공 시 목록·안읽음 캐시를 무효화합니다.
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  deleteAllNotificationsAction,
  deleteNotificationAction,
} from "@/actions/notification/notification";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { useAuthStore } from "@/stores/auth";
import type { AppActionResult } from "@/types/common/action";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

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
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notification.list(userId) });
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

// 개별 삭제: 항목이 즉시 사라지므로 성공 토스트는 생략하고 실패만 알린다.
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation<AppActionResult, Error, string>({
    mutationFn: (notificationId: string) => deleteNotificationAction(notificationId),
    onSuccess: (result) => {
      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.notification.deleteFailed);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notification.list(userId) });
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
