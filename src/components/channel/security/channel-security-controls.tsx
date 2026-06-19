"use client";
// 채널 보안 설정 화면의 복사, 보기, 재발급 상호작용을 관리합니다.

import { ObsUrlCard } from "@/components/channel/security/obs-url-card";
import { StreamKeyCard } from "@/components/channel/security/stream-key-card";
import { CHANNEL_SECURITY_URL_CARD_META } from "@/constants/channel/security";
import { useChannelSecurityControls } from "@/hooks/channel/use-channel-security-controls";
import type { ChannelSecuritySnapshot } from "@/types/channel/security";

interface Props {
  initialSnapshot: ChannelSecuritySnapshot;
}

export function ChannelSecurityControls({ initialSnapshot }: Props) {
  const {
    snapshot,
    rotatingKind,
    isPending,
    isRotating,
    isVisibleKind,
    getRevealRemaining,
    handleCopy,
    handlePreview,
    handleToggleVisible,
    handleRotate,
  } = useChannelSecurityControls(initialSnapshot);

  return (
    <section className="flex min-w-0 flex-col gap-5 xl:flex-1">
      <StreamKeyCard
        snapshot={snapshot}
        disabled={isRotating}
        isRotating={rotatingKind === "stream_key" && isPending}
        isStreamKeyVisible={isVisibleKind("stream_key")}
        streamKeyRevealRemaining={getRevealRemaining("stream_key")}
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
          urlRevealRemaining={getRevealRemaining(meta.tokenKind)}
          onCopy={handleCopy}
          onPreview={(url) => handlePreview(url, meta.popup)}
          onToggleVisible={handleToggleVisible}
          onRotate={handleRotate}
        />
      ))}
    </section>
  );
}
