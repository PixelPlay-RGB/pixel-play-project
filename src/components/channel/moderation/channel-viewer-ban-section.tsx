"use client";
// 강퇴 이력 조회 + 상태 분기(로딩/에러/빈) + 목록 + 페이지네이션 + 페이지 보정을 한 단위로 묶은 섹션.
// 스튜디오 시청자 관리 페이지와 라이브 유저관리 Dialog 가 공유한다 — 데이터/상태/페이지 보정 로직 복붙 금지.
// 같은 훅(useChannelViewerBans)·같은 queryKey 를 쓰므로 한 표면에서 해제하면 다른 표면도 자동 동기화된다.

import { useEffect, useState } from "react";

import { TriangleAlert } from "lucide-react";

import { ChannelViewerBanList } from "@/components/channel/moderation/channel-viewer-ban-list";
import ListPagination from "@/components/common/list-pagination";
import { Spinner } from "@/components/ui/spinner";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { useChannelViewerBans } from "@/hooks/channel/use-channel-viewer-bans";
import { useUnbanChannelViewer } from "@/hooks/channel/use-unban-channel-viewer";
import { cn } from "@/lib/utils";
import { getAppMessage } from "@/utils/common/app-message";

interface Props {
  creatorId: string;
  // Dialog 본문처럼 높이 제한 + 자체 스크롤이 필요한 표면에서 true(스튜디오 페이지는 페이지 스크롤을 쓰므로 false).
  scrollable?: boolean;
}

export function ChannelViewerBanSection({ creatorId, scrollable = false }: Props) {
  const [page, setPage] = useState(1);

  const { bans, totalPages, isLoading, isError, isFetching, isPlaceholderData } =
    useChannelViewerBans(creatorId, page);
  const { unban, isUnbanning } = useUnbanChannelViewer(creatorId);

  // 해제로 현재 페이지가 전체 페이지 수를 넘기면 마지막 페이지로 보정한다.
  useEffect(() => {
    if (page > totalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
        <Spinner className="size-4" />
        제재 이력을 불러오는 중이에요.
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border-destructive/20 bg-destructive/5 text-destructive flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
        <TriangleAlert className="size-6" />
        <p className="text-sm font-medium">
          {getAppMessage(APP_MESSAGE_CODE.error.channel.viewerBanListLoadFailed).description}
        </p>
      </div>
    );
  }

  if (bans.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
        현재 강퇴 중인 시청자가 없어요.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", scrollable && "max-h-150 overflow-y-auto")}>
      <ChannelViewerBanList bans={bans} onUnban={unban} isUnbanning={isUnbanning} />
      <ListPagination
        currentPage={page}
        totalPages={totalPages}
        isFetching={isFetching && isPlaceholderData}
        onPageChange={setPage}
      />
    </div>
  );
}
