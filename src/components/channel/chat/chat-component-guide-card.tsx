// 채팅 메시지와 안내 컴포넌트의 분리 원칙을 안내합니다.

import { ChannelSideTipCard } from "@/components/channel/channel-side-tip-card";
import { MessageSquareText } from "lucide-react";

export function ChatComponentGuideCard() {
  return (
    <ChannelSideTipCard
      icon={<MessageSquareText className="size-5" />}
      title="메시지와 컴포넌트 분리"
      description={`클린봇이 가린 채팅은 메시지 타입으로 남겨요.\n입장 안내와 규칙 확인 안내는 필요한 시청자에게만 보여주는 컴포넌트로 표시합니다.`}
    >
      <p className="text-muted-foreground text-xs leading-5 text-pretty">
        로그인, 팔로우, 규칙 확인 안내는 DB 설정을 읽어 필요한 시청자에게만 보여주세요.
      </p>
    </ChannelSideTipCard>
  );
}
