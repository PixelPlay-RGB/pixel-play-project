// 라이브 시청 페이지 — creatorId로 방송을 조회해 LiveView를 렌더링합니다.

import { LiveView } from "@/components/live/view/live-view";

interface Props {
  params: Promise<{ creatorId: string }>;
}

export default async function LiveWatchPage({ params }: Props) {
  const { creatorId } = await params;

  return <LiveView creatorId={creatorId} />;
}
