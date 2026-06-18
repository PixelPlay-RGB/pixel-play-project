"use client";
// 매니저 권한 목록 표(데스크톱) + 카드(모바일). 매니저만 나열한다 — 크리에이터 본인은 매니저가
// 아니므로 목록에서 제외한다. 해제는 파괴적 동작이라 공용 DeleteConfirmDialog로 확인받는다.

import { useState } from "react";

import { ShieldCheck } from "lucide-react";

import DeleteConfirmDialog from "@/components/common/delete-confirm-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ChannelManagerItem } from "@/types/channel/moderation";
import { formatKstDateTimeNumeric } from "@/utils/common/date";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface Props {
  managers: ChannelManagerItem[];
  onRemove: (targetUserId: string) => Promise<boolean>;
  isRemoving: boolean;
}

function PersonIdentity({
  nickname,
  photoUrl,
  userId,
}: {
  nickname: string;
  photoUrl: string | null;
  userId: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={getAvatarImageSrc(photoUrl)} alt="" />
        <AvatarFallback>{getAvatarFallbackText(nickname)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-foreground truncate font-medium">{nickname}</p>
        <p className="text-muted-foreground truncate font-mono text-xs">{userId}</p>
      </div>
    </div>
  );
}

function ManagerRoleTag({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={cn("text-brand inline-flex items-center gap-1 font-medium", !compact && "text-sm")}
    >
      <ShieldCheck className={compact ? "size-3.5" : "size-4"} />
      매니저
    </span>
  );
}

export function ChannelManagerTable({ managers, onRemove, isRemoving }: Props) {
  const [removeTarget, setRemoveTarget] = useState<ChannelManagerItem | null>(null);

  async function handleConfirmRemove() {
    if (!removeTarget) return;

    const success = await onRemove(removeTarget.managerId);
    if (success) {
      setRemoveTarget(null);
    }
  }

  return (
    <>
      {/* 데스크톱: 표 */}
      <div className="ring-foreground/10 bg-card hidden overflow-hidden rounded-xl shadow-sm ring-1 md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col">닉네임</TableHead>
              <TableHead scope="col" className="text-center">
                등록자
              </TableHead>
              <TableHead scope="col" className="text-center">
                등록일
              </TableHead>
              <TableHead scope="col" className="text-center">
                역할
              </TableHead>
              <TableHead scope="col" className="text-center">
                관리
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {managers.map((manager) => (
              <TableRow key={manager.managerRelationId} className="hover:bg-transparent">
                <TableCell>
                  <PersonIdentity
                    nickname={manager.managerNickname}
                    photoUrl={manager.managerPhotoUrl}
                    userId={manager.managerId}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground text-center">
                  {manager.createdByNickname ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-center tabular-nums">
                  {formatKstDateTimeNumeric(manager.createdAt)}
                </TableCell>
                <TableCell className="text-center">
                  <ManagerRoleTag />
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="destructive"
                    size="default"
                    className="min-w-12"
                    onClick={() => setRemoveTarget(manager)}
                  >
                    해제
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 모바일: 카드 */}
      <ul className="flex flex-col gap-3 md:hidden">
        {managers.map((manager) => (
          <li
            key={manager.managerRelationId}
            className="ring-foreground/10 bg-card flex flex-col gap-3 rounded-xl p-4 shadow-sm ring-1"
          >
            <PersonIdentity
              nickname={manager.managerNickname}
              photoUrl={manager.managerPhotoUrl}
              userId={manager.managerId}
            />
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <ManagerRoleTag compact />
              <span>등록자 {manager.createdByNickname ?? "—"}</span>
              <span className="tabular-nums">{formatKstDateTimeNumeric(manager.createdAt)}</span>
            </div>
            <Button
              variant="destructive"
              size="default"
              className="min-w-12 self-end"
              onClick={() => setRemoveTarget(manager)}
            >
              해제
            </Button>
          </li>
        ))}
      </ul>

      <DeleteConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        title="매니저 권한 해제"
        description={`${removeTarget?.managerNickname ?? ""} 님의 매니저 권한을 해제할까요?\n해제하면 일반 시청자로 돌아갑니다.`}
        isPending={isRemoving}
        onConfirm={handleConfirmRemove}
        confirmLabel="해제"
      />
    </>
  );
}
