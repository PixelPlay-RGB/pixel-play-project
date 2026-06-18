// 채널 보안 설정 화면의 서버 렌더링 영역을 구성합니다.
import { SettingsPage } from "@/components/common/settings-page";
import { SideTipCard } from "@/components/common/side-tip-card";
import { SideTipStep } from "@/components/common/side-tip-step";
import { ChannelSecurityControls } from "@/components/channel/security/channel-security-controls";
import { LoadFailedState } from "@/components/common/load-failed-state";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { ChannelSecuritySnapshot } from "@/types/channel/security";
import { ShieldCheck } from "lucide-react";

interface Props {
  initialSnapshot: ChannelSecuritySnapshot | null;
}

export function ChannelSecurityPageContent({ initialSnapshot }: Props) {
  if (!initialSnapshot) {
    return <LoadFailedState code={APP_MESSAGE_CODE.error.channel.securityLoadFailed} />;
  }

  return (
    <SettingsPage
      kicker="방송 연결"
      title="방송 연결 정보를 안전하게 관리해요"
      description={
        <>
          방송에 필요한 키와 주소를 한곳에서 관리해요.
          <br />
          필요할 때만 확인하시고, 키를 새로 만들었다면 OBS에 다시 붙여 넣어주세요.
        </>
      }
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <ChannelSecurityControls initialSnapshot={initialSnapshot} />

        <SideTipCard
          icon={<ShieldCheck className="size-5" />}
          title="방송 전에 이것만 확인해요"
          description={`키와 주소는 방송에 바로 쓰이는 정보라 기본으로 숨겨져 있어요.\n새로 만들었다면 OBS에 저장된 값도 꼭 바꿔주세요.`}
        >
          <SideTipStep
            number="1"
            title="서버 주소와 스트림 키를 넣어요"
            description={`OBS 설정 > 방송에서 서비스를 사용자 지정으로 바꿔주세요.\n그다음 서버 주소와 스트림 키를 각각 붙여 넣으면 돼요.`}
          />
          <SideTipStep
            number="2"
            title="채팅창 주소를 추가해요"
            description={`OBS 소스에서 브라우저를 추가하고 채팅창 주소를 붙여 넣어주세요.\n권장 크기는 520 x 600이에요.`}
          />
          <SideTipStep
            number="3"
            title="후원 알림 주소를 추가해요"
            description={`채팅창과 별도의 브라우저 소스로 추가해주세요.\n권장 크기는 640 x 360이고, 기본으로 5초 동안 보여요.`}
          />
        </SideTipCard>
      </div>
    </SettingsPage>
  );
}
