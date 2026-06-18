"use client";
// 게시글·댓글 공용 ⋮(케밥) 액션 메뉴. 권한에 따라 수정/삭제 항목을 노출합니다.

import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Props {
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  ariaLabel?: string;
  className?: string;
}

export default function CommunityActionMenu({
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
  ariaLabel = "더보기",
  className,
}: Props) {
  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={ariaLabel}
            className={cn("text-muted-foreground hover:text-foreground shrink-0", className)}
          >
            <EllipsisVertical />
          </Button>
        )}
      />
      <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="min-w-32">
        <DropdownMenuGroup>
          {canEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil />
              수정
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 />
              삭제
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
