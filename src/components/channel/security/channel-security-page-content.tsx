// 채널 보안 설정 화면의 서버 렌더링 영역을 구성합니다.
import { ChannelSideTipCard, ChannelSideTipStep } from "@/components/channel/channel-side-tip-card";
import { ChannelSecurityControls } from "@/components/channel/security/channel-security-controls";
import { SecurityLoadFailedState } from "@/components/channel/security/security-load-failed-state";
import type { ChannelSecuritySnapshot } from "@/types/channel/security";
import { ShieldCheck } from "lucide-react";

interface Props {
  initialSnapshot: ChannelSecuritySnapshot | null;
}

export function ChannelSecurityPageContent({ initialSnapshot }: Props) {
  if (!initialSnapshot) {
    return <SecurityLoadFailedState />;
  }

  return (
    <main className="flex w-full flex-col gap-7">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-2">
          <span className="text-brand text-sm font-bold">방송 연결 보안</span>
          <h1 className="text-foreground text-3xl leading-tight font-bold tracking-tight">
            방송 연결 정보를 관리해요
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-6 text-pretty">
            스트림 키와 채팅창, 후원 알림 주소를 한곳에서 관리합니다. 필요한 순간에만 열어 보고,
            새로 만든 정보는 OBS에 다시 붙여 넣어주세요.
          </p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <ChannelSecurityControls initialSnapshot={initialSnapshot} />

        <ChannelSideTipCard
          icon={<ShieldCheck className="size-5" />}
          title="처음 설정할 때"
          description="키와 주소는 방송에 바로 쓰이는 정보라 기본으로 숨겨둡니다. 새로 만들면 OBS에 넣어둔 값도 함께 바꿔주세요."
        >
          <ChannelSideTipStep
            number="1"
            title="방송 설정에 서버 주소와 스트림 키 넣기"
            description="OBS 설정의 방송 메뉴에서 서버와 스트림 키 입력란에 각각 붙여 넣습니다."
          />
          <ChannelSideTipStep
            number="2"
            title="채팅창 주소를 브라우저 소스로 추가하기"
            description="OBS 소스 목록에서 브라우저를 추가하고 채팅창 주소를 붙여 넣습니다."
          />
          <ChannelSideTipStep
            number="3"
            title="후원 알림 주소를 따로 추가하기"
            description="후원 알림은 채팅창과 다른 브라우저 소스로 분리하면 위치 조절이 쉽습니다."
          />
        </ChannelSideTipCard>
      </div>
    </main>
  );
}
