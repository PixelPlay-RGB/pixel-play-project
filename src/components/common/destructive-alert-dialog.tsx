"use client";
// 파괴적(danger) 동작용 공통 AlertDialog 셸 — destructive 배너 헤더(아이콘 + 제목 + 설명) + 푸터 슬롯.
// 강퇴/삭제 등 여러 확인·안내 다이얼로그가 같은 배너 스타일을 복붙하던 것을 한곳으로 모은다.
// 푸터(children)만 소비자가 정의한다: 확인형은 [취소][실행] 버튼, 안내형은 단일 이동 링크 등.
// onOpenChange 를 넘기지 않으면 완전 제어 모드라 Escape·바깥 클릭으로 닫히지 않는다(예: 강퇴 안내).

import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  // 생략 시 완전 제어 모드(닫기 비활성). 닫힘이 필요한 확인형은 가드한 핸들러를 넘긴다.
  onOpenChange?: (open: boolean) => void;
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  // 푸터 내용 — [취소][실행] 버튼이나 이동 링크 등.
  children: ReactNode;
  // 폭 등 콘텐츠 클래스 보정(기본 sm:max-w-lg).
  contentClassName?: string;
  // 설명 클래스 보정(예: whitespace-pre-line).
  descriptionClassName?: string;
  // 푸터 클래스 보정(예: 버튼 가로 정렬 flex-row gap-2).
  footerClassName?: string;
}

export function DestructiveAlertDialog({
  open,
  onOpenChange,
  icon,
  title,
  description,
  children,
  contentClassName,
  descriptionClassName,
  footerClassName,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        showCloseButton={false}
        className={cn(
          "border-destructive/20 shadow-destructive/10 overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-lg",
          contentClassName,
        )}
      >
        <AlertDialogHeader className="bg-destructive/5 border-destructive/10 flex items-center gap-4 border-b px-5 pt-5 pb-4 text-left">
          <AlertDialogMedia className="bg-destructive/10 text-destructive ring-destructive/20 mb-0 shrink-0 rounded-xl ring-1">
            {icon}
          </AlertDialogMedia>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <AlertDialogTitle className="text-lg leading-tight font-bold">{title}</AlertDialogTitle>
            <AlertDialogDescription
              className={cn("leading-snug text-pretty", descriptionClassName)}
            >
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter
          className={cn("m-0 justify-end border-0 bg-transparent px-5 pt-4 pb-5", footerClassName)}
        >
          {children}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
