"use client";
// 채널 채팅 설정 화면의 폼 상호작용을 관리합니다.

import { SettingsPage } from "@/components/common/settings-page";
import { StickySaveBar } from "@/components/common/sticky-save-bar";
import { ChatComponentGuideCard } from "@/components/channel/chat/chat-component-guide-card";
import { ChatForbiddenWordsField } from "@/components/channel/chat/chat-forbidden-words-field";
import { ChatLinkBlockField } from "@/components/channel/chat/chat-link-block-field";
import { ChatRuleTextField } from "@/components/channel/chat/chat-rule-text-field";
import { ChatScopeField } from "@/components/channel/chat/chat-scope-field";
import { SettingFieldRow } from "@/components/common/setting-field-row";
import { SettingToggleControl } from "@/components/common/setting-toggle-control";
import { SettingsCard } from "@/components/common/settings-card";
import { ChatSlowModeField } from "@/components/channel/chat/chat-slow-mode-field";
import { ChatWaitTimeField } from "@/components/channel/chat/chat-wait-time-field";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChannelChatSettingsForm } from "@/hooks/channel/use-channel-chat-settings-form";
import { useStickyActionBar } from "@/hooks/common/use-sticky-action-bar";
import { cn } from "@/lib/utils";
import type { ChannelChatSnapshot } from "@/types/channel/chat";
import { Controller, useWatch } from "react-hook-form";

interface Props {
  initialSnapshot: ChannelChatSnapshot;
}

export function ChannelChatControls({ initialSnapshot }: Props) {
  const { form, handleSubmit, isSaving } = useChannelChatSettingsForm(initialSnapshot);
  const {
    control,
    setValue,
    reset,
    formState: { isDirty },
  } = form;
  const chatScope = useWatch({ control, name: "chatScope" }) ?? initialSnapshot.chatScope;
  const slowModeSeconds =
    useWatch({ control, name: "slowModeSeconds" }) ?? initialSnapshot.slowModeSeconds;
  const { sentinelRef, show } = useStickyActionBar(isDirty);

  return (
    <SettingsPage
      kicker="방송 채팅 관리"
      title="채팅 규칙을 편하게 관리해요"
      description={
        <>
          시청자가 채팅을 시작하기 전에 필요한 기준을 정해요.
          <br />
          참여 범위, 채팅 속도, 금칙어를 한곳에서 관리할 수 있어요.
        </>
      }
      action={
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving || !isDirty}
          className={cn(
            "h-11 shrink-0 rounded-xl px-7 font-bold lg:w-auto",
            "bg-brand hover:bg-brand/90 text-brand-foreground",
            "shadow-brand/20 shadow-sm transition-all active:scale-95",
          )}
        >
          {isSaving ? <Spinner /> : "변경사항 저장"}
        </Button>
      }
    >
      <div ref={sentinelRef} aria-hidden />

      <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <SettingsCard title="채팅 설정" description="방송에서 적용할 채팅 설정이에요.">
              <Controller
                name="chatScope"
                control={control}
                render={({ field }) => (
                  <ChatScopeField
                    value={field.value}
                    disabled={isSaving}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                name="followerWaitSeconds"
                control={control}
                render={({ field }) => (
                  <ChatWaitTimeField
                    value={field.value}
                    disabled={isSaving}
                    isActive={chatScope === "follower"}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                name="slowModeEnabled"
                control={control}
                render={({ field }) => (
                  <ChatSlowModeField
                    enabled={field.value}
                    seconds={slowModeSeconds}
                    disabled={isSaving}
                    onEnabledChange={field.onChange}
                    onSecondsChange={(value) =>
                      setValue("slowModeSeconds", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                )}
              />
              <Controller
                name="linkBlocked"
                control={control}
                render={({ field }) => (
                  <ChatLinkBlockField
                    value={field.value}
                    disabled={isSaving}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                name="chatDonationMessageEnabled"
                control={control}
                render={({ field }) => (
                  <SettingFieldRow
                    label="채팅창 후원 메시지"
                    description="후원이 들어오면 채팅 오버레이(OBS 채팅창 주소)에도 후원 메시지를 함께 보여줘요."
                  >
                    <SettingToggleControl
                      checked={field.value}
                      checkedLabel="ON"
                      uncheckedLabel="OFF"
                      ariaLabel="채팅창 후원 메시지 표시"
                      disabled={isSaving}
                      onChange={field.onChange}
                    />
                  </SettingFieldRow>
                )}
              />
            </SettingsCard>

            <SettingsCard
              title="금칙어"
              description="한 단어씩 입력하고 추가 버튼으로 바로 등록합니다."
            >
              <Controller
                name="forbiddenWords"
                control={control}
                render={({ field, fieldState }) => (
                  <ChatForbiddenWordsField
                    value={field.value}
                    disabled={isSaving}
                    error={fieldState.error?.message}
                    onChange={field.onChange}
                  />
                )}
              />
            </SettingsCard>
          </div>

          <div className="flex min-w-0 flex-col gap-5 xl:w-120 xl:shrink-0">
            <SettingsCard
              title="채팅 규칙 안내문"
              description="시청자가 처음 채팅하려 할 때 입력창 위 안내 컴포넌트에 표시됩니다."
            >
              <Controller
                name="chatRuleText"
                control={control}
                render={({ field }) => (
                  <ChatRuleTextField
                    value={field.value}
                    disabled={isSaving}
                    onChange={field.onChange}
                  />
                )}
              />
            </SettingsCard>
            <ChatComponentGuideCard />
          </div>
        </div>
      </form>

      <StickySaveBar
        show={show}
        isSaving={isSaving}
        canSave={isDirty}
        onSave={handleSubmit}
        onReset={() => reset()}
      />
    </SettingsPage>
  );
}
