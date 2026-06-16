"use client";
// 권한 목록 표(데스크톱) + 카드(모바일). 스트리머 본인(크리에이터)을 맨 위에 고정하고 매니저를 아래로 나열한다
// (위→아래 = 크리에이터 → 매니저). 해제는 파괴적 동작이라 공용 DeleteConfirmDialog로 확인받는다.

import { useState } from "react";

import { Crown, ShieldCheck, type LucideIcon } from "lucide-react";

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
import type { ChannelManagerItem, ChannelOwnerIdentity } from "@/types/channel/moderation";
import { formatKstDateTimeNumeric } from "@/utils/common/date";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

type PermissionRole = "creator" | "manager";

// 스트리머·매니저를 한 가지 행 모델로 통합해 데스크톱/모바일이 같은 데이터를 렌더한다.
interface PermissionRow {
  key: string;
  userId: string;
  nickname: string;
  photoUrl: string | null;
  registrantNickname: string | null; // 등록자(크리에이터 본인은 없음)
  createdAt: string | null; // 등록일(크리에이터 본인은 없음)
  role: PermissionRole;
  removableManager: ChannelManagerItem | null; // null = 해제 불가(스트리머 본인)
}

const ROLE_META: Record<PermissionRole, { icon: LucideIcon; label: string }> = {
  creator: { icon: Crown, label: "크리에이터" },
  manager: { icon: ShieldCheck, label: "매니저" },
};

interface Props {
  creator: ChannelOwnerIdentity;
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

function RoleTag({ role, compact = false }: { role: PermissionRole; compact?: boolean }) {
  const { icon: Icon, label } = ROLE_META[role];

  return (
    <span
      className={cn("text-brand inline-flex items-center gap-1 font-medium", !compact && "text-sm")}
    >
      <Icon className={compact ? "size-3.5" : "size-4"} />
      {label}
    </span>
  );
}

export function ChannelManagerTable({ creator, managers, onRemove, isRemoving }: Props) {
  const [removeTarget, setRemoveTarget] = useState<ChannelManagerItem | null>(null);

  const rows: PermissionRow[] = [
    {
      key: `creator-${creator.id}`,
      userId: creator.id,
      nickname: creator.nickname,
      photoUrl: creator.photoUrl,
      registrantNickname: null,
      createdAt: null,
      role: "creator",
      removableManager: null,
    },
    ...managers.map((manager) => ({
      key: manager.managerRelationId,
      userId: manager.managerId,
      nickname: manager.managerNickname,
      photoUrl: manager.managerPhotoUrl,
      registrantNickname: manager.createdByNickname,
      createdAt: manager.createdAt,
      role: "manager" as const,
      removableManager: manager,
    })),
  ];

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
            {rows.map((row) => {
              const { removableManager } = row;

              return (
                <TableRow key={row.key} className="hover:bg-transparent">
                  <TableCell>
                    <PersonIdentity
                      nickname={row.nickname}
                      photoUrl={row.photoUrl}
                      userId={row.userId}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-center">
                    {row.registrantNickname ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-center tabular-nums">
                    {row.createdAt ? formatKstDateTimeNumeric(row.createdAt) : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <RoleTag role={row.role} />
                  </TableCell>
                  <TableCell className="text-center">
                    {removableManager ? (
                      <Button
                        variant="destructive"
                        size="default"
                        className="min-w-12"
                        onClick={() => setRemoveTarget(removableManager)}
                      >
                        해제
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 모바일: 카드 */}
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => {
          const { removableManager } = row;

          return (
            <li
              key={row.key}
              className="ring-foreground/10 bg-card flex flex-col gap-3 rounded-xl p-4 shadow-sm ring-1"
            >
              <PersonIdentity nickname={row.nickname} photoUrl={row.photoUrl} userId={row.userId} />
              <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <RoleTag role={row.role} compact />
                <span>등록자 {row.registrantNickname ?? "—"}</span>
                {row.createdAt && (
                  <span className="tabular-nums">{formatKstDateTimeNumeric(row.createdAt)}</span>
                )}
              </div>
              {removableManager && (
                <Button
                  variant="destructive"
                  size="default"
                  className="min-w-12 self-end"
                  onClick={() => setRemoveTarget(removableManager)}
                >
                  해제
                </Button>
              )}
            </li>
          );
        })}
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
