// 채널 채팅 설정 화면의 서버 렌더링 영역을 구성합니다.

import { ChannelSideTipCard, ChannelSideTipStep } from "@/components/channel/channel-side-tip-card";
import { ChannelChatControls } from "@/components/channel/chat/channel-chat-controls";
import { ChatSettingsLoadFailedState } from "@/components/channel/chat/chat-settings-load-failed-state";
import type { ChannelChatSnapshot } from "@/types/channel/chat";
import { MessageSquareText } from "lucide-react";

interface Props {
  initialSnapshot: ChannelChatSnapshot | null;
}

export function ChannelChatPageContent({ initialSnapshot }: Props) {
  if (!initialSnapshot) {
    return <ChatSettingsLoadFailedState />;
  }

  return (
    <main className="flex w-full flex-col gap-7">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-2">
          <span className="text-brand text-sm font-bold">라이브 채팅 설정</span>
          <h1 className="text-foreground text-3xl leading-tight font-bold tracking-tight">
            채팅이 편안하게 흐르도록 정리해요
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-6 text-pretty">
            방송 채팅의 참여 조건과 기본 규칙을 정해요.
            <br />
            저장한 내용은 시청자가 채팅을 보내는 순간부터 바로 적용됩니다.
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <ChannelChatControls initialSnapshot={initialSnapshot} />

        <ChannelSideTipCard
          className="xl:w-fit xl:max-w-120 xl:shrink-0"
          icon={<MessageSquareText className="size-5" />}
          title="처음 채팅하는 사람도 이해하기 쉽게"
          description={`채팅 설정은 시청자가 입력창에서 바로 체감하는 규칙이에요.\n너무 어렵게 막기보다 방송 분위기에 필요한 만큼만 정해보세요.`}
        >
          <ChannelSideTipStep
            number="1"
            title="참여 범위를 먼저 정해요"
            description={`기본은 모든 로그인 유저예요.\n분위기 관리가 필요하면 팔로잉한 시청자나 방장만으로 좁힐 수 있어요.`}
          />
          <ChannelSideTipStep
            number="2"
            title="도배는 저속 모드로 줄여요"
            description={`시청자가 많아질수록 채팅 간격을 조금 늘려보세요.\n방장은 저속 모드의 영향을 받지 않아요.`}
          />
          <ChannelSideTipStep
            number="3"
            title="규칙은 짧고 분명하게 써요"
            description={`첫 채팅 전 안내문은 시청자가 확인해야 하는 문장이에요.\n금칙어는 꼭 필요한 단어만 등록하는 편이 좋아요.`}
          />
        </ChannelSideTipCard>
      </div>
    </main>
  );
}
