// 라이브 채팅 팝아웃 페이지 — 채팅 전용 화면을 렌더링합니다.

import { LiveChatPopout } from "@/components/live/chat/live-chat-popout";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ creatorId: string }>;
}

export default async function LiveChatPopoutPage({ params }: Props) {
  const { creatorId } = await params;
  if (!creatorId) {
    notFound();
  }
  
  return <LiveChatPopout creatorId={creatorId} />;
}
