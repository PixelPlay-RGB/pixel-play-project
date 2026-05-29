"use client";
// 채널 채팅 설정 화면의 폼 상호작용을 관리합니다.

import { ChannelChatFormHeader } from "@/components/channel/chat/channel-chat-form-header";
import { ChatComponentGuideCard } from "@/components/channel/chat/chat-component-guide-card";
import { ChatForbiddenWordsField } from "@/components/channel/chat/chat-forbidden-words-field";
import { ChatLinkBlockField } from "@/components/channel/chat/chat-link-block-field";
import { ChatRuleTextField } from "@/components/channel/chat/chat-rule-text-field";
import { ChatScopeField } from "@/components/channel/chat/chat-scope-field";
import { ChatSettingsCard } from "@/components/channel/chat/chat-settings-card";
import { ChatSlowModeField } from "@/components/channel/chat/chat-slow-mode-field";
import { ChatWaitTimeField } from "@/components/channel/chat/chat-wait-time-field";
import { useChannelChatSettingsForm } from "@/hooks/channel/use-channel-chat-settings-form";
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
    formState: { isDirty },
  } = form;
  const chatScope = useWatch({ control, name: "chatScope" }) ?? initialSnapshot.chatScope;
  const slowModeSeconds =
    useWatch({ control, name: "slowModeSeconds" }) ?? initialSnapshot.slowModeSeconds;

  return (
    <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-5">
      <ChannelChatFormHeader isSaving={isSaving} canSubmit={isDirty} />

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <ChatSettingsCard
            title="채팅 기본값"
            description="방송 시작 시 적용할 채팅 참여 규칙입니다. MVP에서 채팅 입력은 로그인 후에만 가능합니다."
          >
            <Controller
              name="chatScope"
              control={control}
              render={({ field }) => (
                <ChatScopeField value={field.value} disabled={isSaving} onChange={field.onChange} />
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
          </ChatSettingsCard>

          <ChatSettingsCard
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
          </ChatSettingsCard>
        </div>

        <div className="flex min-w-0 flex-col gap-5 xl:w-65 xl:shrink-0">
          <ChatSettingsCard
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
          </ChatSettingsCard>
          <ChatComponentGuideCard />
        </div>
      </div>
    </form>
  );
}
