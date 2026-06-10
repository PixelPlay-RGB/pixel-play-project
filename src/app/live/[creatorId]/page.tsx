// 라이브 시청 페이지 — creatorId로 방송을 조회해 LiveView를 렌더링합니다.

import { getLivePlaybackUrl } from "@/app/live/[creatorId]/_data/live-playback-data";
import LiveShell from "@/components/live/live-shell";
import { LiveView } from "@/components/live/view/live-view";

interface Props {
  params: Promise<{ creatorId: string }>;
}

export default async function LiveWatchPage({ params }: Props) {
  const { creatorId } = await params;
  const hlsSrc = await getLivePlaybackUrl(creatorId);

  return (
    <LiveShell contentClassName="overflow-y-auto md:overflow-hidden">
      {/*
        key로 creatorId를 묶어, 같은 라우트(/live/[creatorId]) 안에서 다른 크리에이터로
        소프트 내비게이션할 때 LiveView를 재마운트해 시청 상태(sticky broadcastId·optimistic
        팔로우·채팅 접힘 등)가 이전 크리에이터에서 새어나오지 않게 한다.
      */}
      <LiveView key={creatorId} creatorId={creatorId} hlsSrc={hlsSrc} />
    </LiveShell>
  );
}
