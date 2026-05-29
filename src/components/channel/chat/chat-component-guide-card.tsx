// 채팅 메시지와 안내 컴포넌트의 분리 원칙을 안내합니다.

import { ChannelSideTipCard, ChannelSideTipStep } from "@/components/channel/channel-side-tip-card";
import { MessageSquareText } from "lucide-react";

export function ChatComponentGuideCard() {
  return (
    <ChannelSideTipCard
      icon={<MessageSquareText className="size-5" />}
      title="채팅 전에 이것만 확인해요"
      description={`안내문과 제한 규칙은 시청자가 채팅을 시작하기 전에 보여요.\n방송 분위기에 맞게 짧고 분명하게 적어주세요.`}
    >
      <ChannelSideTipStep
        number="1"
        title="참여 범위를 정해요"
        description={`기본 채팅은 로그인한 시청자만 사용할 수 있어요.\n필요하면 팔로워만 채팅할 수 있게 바꿀 수 있어요.`}
      />
      <ChannelSideTipStep
        number="2"
        title="채팅 속도를 조절해요"
        description={`저속 모드를 켜면 같은 시청자가 연속으로 보내는 채팅 간격을 둘 수 있어요.`}
      />
      <ChannelSideTipStep
        number="3"
        title="금칙어를 등록해요"
        description={`등록한 단어가 포함된 메시지는 방송 채팅에서 자동으로 가려져요.`}
      />
    </ChannelSideTipCard>
  );
}
