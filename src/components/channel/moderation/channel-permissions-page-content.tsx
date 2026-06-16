"use client";
// 채널 매니저 관리 화면 — 좌측: 매니저 추가 폼 + 권한 목록(스트리머 본인 + 매니저), 우측: 사용 팁.
// 데이터는 TanStack 캐시(useChannelManagers)가 소유한다. 다른 설정 라우터(채팅·후원·이모지)와 결을 맞춘 2단.

import { useMemo } from "react";

import { ShieldCheck, TriangleAlert } from "lucide-react";

import { ChannelManagerAddForm } from "@/components/channel/moderation/channel-manager-add-form";
import { ChannelManagerTable } from "@/components/channel/moderation/channel-manager-table";
import { SettingsPage } from "@/components/common/settings-page";
import { SideTipCard, SideTipStep } from "@/components/common/side-tip-card";
import { Spinner } from "@/components/ui/spinner";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { useChannelManagers } from "@/hooks/channel/use-channel-managers";
import type { ChannelOwnerIdentity } from "@/types/channel/moderation";
import { getAppMessage } from "@/utils/common/app-message";

interface Props {
  creator: ChannelOwnerIdentity;
}

export function ChannelPermissionsPageContent({ creator }: Props) {
  const { managers, isLoading, isError, addManager, isAdding, removeManager, isRemoving } =
    useChannelManagers(creator.id);

  const existingManagerIds = useMemo(
    () => new Set(managers.map((manager) => manager.managerId)),
    [managers],
  );

  return (
    <SettingsPage
      kicker="매니저 관리"
      title="채널 매니저를 관리해요"
      description={
        <>
          매니저는 채널 운영을 돕는 신뢰할 수 있는 시청자예요.
          <br />
          믿을 수 있는 시청자에게만 권한을 주고, 필요 없어지면 바로 해제하세요.
        </>
      }
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        {/* 좌측 — 매니저 추가 + 목록 */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <ChannelManagerAddForm
            creatorId={creator.id}
            existingManagerIds={existingManagerIds}
            onAdd={addManager}
            isAdding={isAdding}
          />

          {isLoading ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
              <Spinner className="size-4" />
              매니저 목록을 불러오는 중이에요.
            </div>
          ) : isError ? (
            <div className="border-destructive/20 bg-destructive/5 text-destructive flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
              <TriangleAlert className="size-6" />
              <p className="text-sm font-medium">
                {getAppMessage(APP_MESSAGE_CODE.error.channel.managerListLoadFailed).description}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <ChannelManagerTable
                creator={creator}
                managers={managers}
                onRemove={removeManager}
                isRemoving={isRemoving}
              />
              {managers.length === 0 && (
                <p className="text-muted-foreground text-center text-sm">
                  아직 매니저가 없어요. 위에서 시청자를 검색해 추가해 보세요.
                </p>
              )}
            </div>
          )}
        </div>

        {/* 우측 — 사용 팁 */}
        <div className="flex min-w-0 flex-col gap-5 xl:w-120 xl:shrink-0">
          <SideTipCard
            icon={<ShieldCheck className="size-5" />}
            title="매니저를 두기 전에 확인해요"
            description={`매니저는 크리에이터를 대신해 채팅을 관리해요.\n권한이 큰 만큼 믿을 수 있는 시청자에게만 맡기세요.`}
          >
            <SideTipStep
              number="1"
              title="신뢰할 수 있는 시청자만"
              description={`매니저는 채팅을 가리거나 시청자를 제재할 수 있어요.\n오래 함께한, 믿을 수 있는 시청자에게만 권한을 주세요.`}
            />
            <SideTipStep
              number="2"
              title="필요 없어지면 바로 해제"
              description={`권한은 언제든 해제할 수 있어요.\n활동이 없거나 신뢰가 흔들리면 곧바로 정리하세요.`}
            />
            <SideTipStep
              number="3"
              title="본인은 항상 최고 권한"
              description={`크리에이터 본인은 매니저와 무관하게 모든 권한을 가져요.\n매니저 권한은 채널 운영을 돕는 보조 권한이에요.`}
            />
          </SideTipCard>
        </div>
      </div>
    </SettingsPage>
  );
}
