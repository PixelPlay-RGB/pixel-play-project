"use client";
// 채널 보안 재발급 Dialog의 공통 본문을 렌더링합니다.

import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import type { LucideIcon } from "lucide-react";
import { TriangleAlert } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  warnings: string[];
  isRotating: boolean;
  onConfirm: () => void;
}

export function SecurityReissueDialogContent({
  icon: Icon,
  title,
  description,
  warnings,
  isRotating,
  onConfirm,
}: Props) {
  return (
    <AlertDialogContent className="overflow-hidden rounded-2xl p-0 shadow-xl data-[size=default]:max-w-sm data-[size=default]:sm:max-w-xl">
      <AlertDialogHeader className="border-destructive/10 bg-destructive/5 flex items-center gap-4 border-b px-6 pt-6 pb-5 text-left sm:gap-5 sm:px-7">
        <AlertDialogMedia className="bg-destructive/10 text-destructive ring-destructive/20 mb-0 size-12 shrink-0 rounded-xl ring-1">
          <Icon className="size-6" />
        </AlertDialogMedia>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <AlertDialogTitle className="text-xl leading-7 font-bold text-pretty">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base leading-6 text-pretty">
            {description}
          </AlertDialogDescription>
        </div>
      </AlertDialogHeader>
      <div className="px-6 py-5 sm:px-7">
        <div className="border-destructive/15 bg-destructive/5 grid gap-3 rounded-xl border p-4 text-base">
          {warnings.map((warning) => (
            <span key={warning} className="flex gap-3 leading-6 text-pretty">
              <TriangleAlert className="text-destructive mt-0.5 size-5 shrink-0" />
              {warning}
            </span>
          ))}
        </div>
      </div>
      <AlertDialogFooter className="m-0 flex-row justify-end gap-2 border-0 bg-transparent px-6 pt-0 pb-6 sm:px-7">
        <AlertDialogCancel disabled={isRotating} className="h-11 min-w-28">
          취소
        </AlertDialogCancel>
        <AlertDialogAction
          variant="destructive"
          disabled={isRotating}
          className="h-11 min-w-28"
          onClick={onConfirm}
        >
          {isRotating ? <Spinner /> : "새로 만들기"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
