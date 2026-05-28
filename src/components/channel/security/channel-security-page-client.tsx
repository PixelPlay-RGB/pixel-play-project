"use client";
// 채널 보안 설정 화면의 섹션 구성을 렌더링합니다.

import { ChannelSideTipCard, ChannelSideTipStep } from "@/components/channel/channel-side-tip-card";
import { ObsUrlCard } from "@/components/channel/security/obs-url-card";
import { SecurityLoadFailedState } from "@/components/channel/security/security-load-failed-state";
import { StreamKeyCard } from "@/components/channel/security/stream-key-card";
import { CHANNEL_SECURITY_URL_CARD_META } from "@/constants/channel/security";
import { useChannelSecurityControls } from "@/hooks/channel/use-channel-security-controls";
import type { ChannelSecuritySnapshot } from "@/types/channel/security";
import { ShieldCheck } from "lucide-react";

interface Props {
  initialSnapshot: ChannelSecuritySnapshot | null;
}

export default function ChannelSecurityPageClient({ initialSnapshot }: Props) {
  const {
    snapshot,
    rotatingKind,
    isPending,
    isRotating,
    isVisibleKind,
    handleCopy,
    handlePreview,
    handleToggleVisible,
    handleRotate,
  } = useChannelSecurityControls(initialSnapshot);

  if (!snapshot) {
    return <SecurityLoadFailedState />;
  }

  return (
    <main className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-2">
          <span className="text-brand text-sm font-bold">OBS 보안 정보</span>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">보안 설정</h1>
          <p className="text-muted-foreground text-sm leading-6">
            OBS Studio에 붙여 넣을 방송 연결 정보와 채팅창·후원 알림 주소를 관리합니다. 민감한
            정보는 확인 버튼을 누른 뒤에만 전체 내용을 보여줍니다.
          </p>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="flex min-w-0 flex-col gap-4">
          <StreamKeyCard
            snapshot={snapshot}
            disabled={isRotating}
            isRotating={rotatingKind === "stream_key" && isPending}
            isStreamKeyVisible={isVisibleKind("stream_key")}
            onCopy={handleCopy}
            onToggleVisible={handleToggleVisible}
            onRotate={handleRotate}
          />
          {CHANNEL_SECURITY_URL_CARD_META.map((meta) => (
            <ObsUrlCard
              key={meta.tokenKind}
              meta={meta}
              snapshot={snapshot}
              disabled={isRotating}
              isRotating={rotatingKind === meta.tokenKind && isPending}
              isUrlVisible={isVisibleKind(meta.tokenKind)}
              onCopy={handleCopy}
              onPreview={(url) => handlePreview(url, meta.popup)}
              onToggleVisible={handleToggleVisible}
              onRotate={handleRotate}
            />
          ))}
        </section>

        <ChannelSideTipCard
          icon={<ShieldCheck className="size-5" />}
          title="보안 원칙"
          description="스트림 키와 OBS 주소는 처음에는 숨겨둡니다. 새로 발급하면 OBS에 저장한 정보도 다시 바꿔야 합니다."
        >
          <ChannelSideTipStep
            number="1"
            title="스트림 URL과 스트림 키를 OBS에 입력"
            description="OBS 방송 설정의 서버와 스트림 키 입력란에 각각 붙여 넣습니다."
          />
          <ChannelSideTipStep
            number="2"
            title="채팅창 URL을 OBS에 추가"
            description="OBS 브라우저 소스에 붙여 넣으면 방송 화면에 채팅창이 표시됩니다."
          />
          <ChannelSideTipStep
            number="3"
            title="후원 알림 URL을 OBS에 따로 추가"
            description="후원 알림은 채팅창과 분리해서 방송 화면에 표시합니다."
          />
        </ChannelSideTipCard>
      </div>
    </main>
  );
}
