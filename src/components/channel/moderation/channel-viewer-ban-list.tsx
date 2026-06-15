"use client";
// 시청자 제재 이력 목록(데스크톱 표 + 모바일 카드) — 표시 전용(props만). 스튜디오 페이지와 라이브
// 유저관리 Dialog 가 공유한다(복붙 금지). 닉네임은 강퇴 당시 스냅샷이고, 해제는 활성 밴 행에만 노출한다.
// 해제는 강퇴를 되돌리는(접근 복원) 동작이라 파괴적 danger 톤이 아닌 기본(brand) 확인으로 받는다.

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ChannelViewerBanItem } from "@/types/channel/moderation";
import { formatKstDateTimeNumeric } from "@/utils/common/date";
import { getAvatarFallbackText } from "@/utils/profile/avatar";
import { RotateCcw } from "lucide-react";

interface Props {
  bans: ChannelViewerBanItem[];
  onUnban: (targetUserId: string) => Promise<boolean>;
  isUnbanning: boolean;
}

function BannedIdentity({ nickname, userId }: { nickname: string; userId: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9 shrink-0">
        <AvatarFallback>{getAvatarFallbackText(nickname)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-foreground truncate font-medium">{nickname}</p>
        <p className="text-muted-foreground truncate font-mono text-xs">{userId}</p>
      </div>
    </div>
  );
}

function StatusTag({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        isActive ? "bg-error/10 text-error" : "bg-muted text-muted-foreground",
      )}
    >
      {isActive ? "강퇴 중" : "해제됨"}
    </span>
  );
}

export function ChannelViewerBanList({ bans, onUnban, isUnbanning }: Props) {
  const [unbanTarget, setUnbanTarget] = useState<ChannelViewerBanItem | null>(null);

  async function handleConfirmUnban() {
    if (!unbanTarget) return;

    const success = await onUnban(unbanTarget.bannedUserId);
    if (success) {
      setUnbanTarget(null);
    }
  }

  return (
    <>
      {/* 데스크톱: 표 */}
      <div className="ring-foreground/10 bg-card hidden overflow-hidden rounded-xl shadow-sm ring-1 md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col">대상</TableHead>
              <TableHead scope="col" className="text-center">
                강퇴한 사람
              </TableHead>
              <TableHead scope="col" className="text-center">
                일시
              </TableHead>
              <TableHead scope="col" className="text-center">
                상태
              </TableHead>
              <TableHead scope="col" className="text-center">
                관리
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bans.map((ban) => (
              <TableRow key={ban.banId} className="hover:bg-transparent">
                <TableCell>
                  <BannedIdentity nickname={ban.bannedUserNickname} userId={ban.bannedUserId} />
                </TableCell>
                <TableCell className="text-muted-foreground text-center">
                  {ban.bannedByNickname ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-center tabular-nums">
                  {formatKstDateTimeNumeric(ban.bannedAt)}
                </TableCell>
                <TableCell className="text-center">
                  <StatusTag isActive={ban.isActive} />
                </TableCell>
                <TableCell className="text-center">
                  {ban.isActive ? (
                    <Button variant="outline" size="sm" onClick={() => setUnbanTarget(ban)}>
                      해제
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 모바일: 카드 */}
      <ul className="flex flex-col gap-3 md:hidden">
        {bans.map((ban) => (
          <li
            key={ban.banId}
            className="ring-foreground/10 bg-card flex flex-col gap-3 rounded-xl p-4 shadow-sm ring-1"
          >
            <div className="flex items-start justify-between gap-2">
              <BannedIdentity nickname={ban.bannedUserNickname} userId={ban.bannedUserId} />
              <StatusTag isActive={ban.isActive} />
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span>강퇴 {ban.bannedByNickname ?? "—"}</span>
              <span className="tabular-nums">{formatKstDateTimeNumeric(ban.bannedAt)}</span>
            </div>
            {ban.isActive && (
              <Button
                variant="outline"
                size="sm"
                className="self-end"
                onClick={() => setUnbanTarget(ban)}
              >
                해제
              </Button>
            )}
          </li>
        ))}
      </ul>

      <AlertDialog
        open={unbanTarget !== null}
        onOpenChange={(open) => {
          if (!isUnbanning && !open) setUnbanTarget(null);
        }}
      >
        <AlertDialogContent
          showCloseButton={false}
          className="overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-lg"
        >
          <AlertDialogHeader className="bg-muted/40 flex items-center gap-4 border-b px-5 pt-5 pb-4 text-left">
            <AlertDialogMedia className="bg-brand/10 text-brand ring-brand/20 mb-0 shrink-0 rounded-xl ring-1">
              <RotateCcw />
            </AlertDialogMedia>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <AlertDialogTitle className="text-lg leading-tight font-bold">
                강퇴 해제
              </AlertDialogTitle>
              <AlertDialogDescription className="leading-snug text-pretty">
                {`${unbanTarget?.bannedUserNickname ?? ""} 님의 강퇴를 해제할까요? 다시 채널을 이용할 수 있어요.`}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="m-0 flex-row justify-end gap-2 border-0 bg-transparent px-5 pt-4 pb-5">
            <AlertDialogCancel
              disabled={isUnbanning}
              className="border-border bg-background text-foreground hover:bg-muted h-10 min-w-24 rounded-xl px-4 font-semibold"
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              disabled={isUnbanning}
              onClick={handleConfirmUnban}
              className="bg-brand hover:bg-brand/85 text-brand-foreground h-10 min-w-24 rounded-xl px-4 font-bold"
            >
              {isUnbanning ? <Spinner className="size-4" /> : "해제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
