// 극장·전체화면에서 컨트롤과 함께 hover로 나타나는 상단 정보 바.
// 일반 모드는 비디오 아래에 스트리머 행·제목을 그대로 보여주므로 이 오버레이를 쓰지 않는다.
// (극장·전체화면에선 그 행들이 숨겨져 제목·스트리머가 안 보이는데, 그걸 상단 hover로 복원한다.)

import { Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LIVE_LABEL } from "@/constants/live/live";
import { formatCount } from "@/utils/live/live-chat";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";
import type { LiveCreator } from "@/types/live/live";

interface Props {
  title: string;
  creator: LiveCreator;
  // 몰입 모드(극장·전체화면)에선 하단 컨트롤 바 대신 방송 시간·시청자 수를 여기 상단에 모아 보여준다(치지직식).
  elapsedText: string;
  viewerCount: number;
}

export function LivePlayerTopOverlay({ title, creator, elapsedText, viewerCount }: Props) {
  return (
    <div className="flex items-center gap-3">
      {/* 사이드바 라이브 아바타와 동일한 라이브 링(ring-live). */}
      <Avatar size="lg" className="ring-live/80 shrink-0 ring-2">
        <AvatarImage src={getAvatarImageSrc(creator.avatarUrl)} alt={`${creator.name} 프로필`} />
        <AvatarFallback>{getAvatarFallbackText(creator.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white sm:text-base">{title}</p>
        <p className="truncate text-xs text-white/70">{creator.name}</p>
        {/* 좁은 모드(하단 컨트롤 바·정보 행)와 동일하게 시간 → 시청자 수 순으로 둔다. */}
        <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-white/80">
          <span className="font-mono tabular-nums">{elapsedText}</span>
          <span className="text-white/50">·</span>
          <span className="text-brand flex items-center gap-1">
            <Users className="size-3" />
            {formatCount(viewerCount)}
            {LIVE_LABEL.viewers}
          </span>
        </p>
      </div>
    </div>
  );
}
