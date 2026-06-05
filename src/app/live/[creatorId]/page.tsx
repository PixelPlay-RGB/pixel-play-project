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
      <LiveView creatorId={creatorId} hlsSrc={hlsSrc} />
    </LiveShell>
  );
}
