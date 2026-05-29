"use client";
// 채널 채팅 설정 화면의 폼 상호작용을 관리합니다.

import { ChatForbiddenWordsField } from "@/components/channel/chat/chat-forbidden-words-field";
import { ChatLinkBlockField } from "@/components/channel/chat/chat-link-block-field";
import { ChatRuleTextField } from "@/components/channel/chat/chat-rule-text-field";
import { ChatScopeField } from "@/components/channel/chat/chat-scope-field";
import { ChatSettingsCard } from "@/components/channel/chat/chat-settings-card";
import { ChatSlowModeField } from "@/components/channel/chat/chat-slow-mode-field";
import { ChatWaitTimeField } from "@/components/channel/chat/chat-wait-time-field";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChannelChatSettingsForm } from "@/hooks/channel/use-channel-chat-settings-form";
import type { ChannelChatSnapshot } from "@/types/channel/chat";
import { LockKeyhole, MessageSquareText, ShieldCheck } from "lucide-react";
import { Controller, useWatch } from "react-hook-form";

interface Props {
  initialSnapshot: ChannelChatSnapshot;
}

export function ChannelChatControls({ initialSnapshot }: Props) {
  const { form, snapshot, handleSubmit, isSaving } = useChannelChatSettingsForm(initialSnapshot);
  const {
    control,
    formState: { isDirty },
  } = form;
  const chatScope = useWatch({ control, name: "chatScope" });

  return (
    <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-5 xl:flex-1">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground text-xs leading-5">
          현재 규칙 버전은{" "}
          <span className="text-foreground font-bold">v{snapshot.chatRuleVersion}</span>이에요.
        </div>
        <Button
          type="submit"
          disabled={isSaving || !isDirty}
          className="bg-brand hover:bg-brand/85 text-white sm:w-28"
        >
          {isSaving ? <Spinner /> : "저장"}
        </Button>
      </div>

      <ChatSettingsCard
        icon={LockKeyhole}
        title="채팅 기본값"
        description="방송 시작 시 적용할 채팅 참여 규칙이에요."
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
      </ChatSettingsCard>

      <ChatSettingsCard
        icon={MessageSquareText}
        title="채팅 흐름"
        description="도배와 링크처럼 방송 흐름을 흔들 수 있는 입력을 관리해요."
      >
        <Controller
          name="slowModeEnabled"
          control={control}
          render={({ field }) => (
            <Controller
              name="slowModeSeconds"
              control={control}
              render={({ field: secondsField }) => (
                <ChatSlowModeField
                  enabled={field.value}
                  seconds={secondsField.value}
                  disabled={isSaving}
                  onEnabledChange={field.onChange}
                  onSecondsChange={secondsField.onChange}
                />
              )}
            />
          )}
        />
        <Controller
          name="linkBlocked"
          control={control}
          render={({ field }) => (
            <ChatLinkBlockField value={field.value} disabled={isSaving} onChange={field.onChange} />
          )}
        />
      </ChatSettingsCard>

      <ChatSettingsCard
        icon={ShieldCheck}
        title="규칙과 금칙어"
        description="처음 채팅하는 시청자에게 보여줄 안내와 자동으로 가릴 단어를 정해요."
      >
        <Controller
          name="chatRuleText"
          control={control}
          render={({ field }) => (
            <ChatRuleTextField value={field.value} disabled={isSaving} onChange={field.onChange} />
          )}
        />
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
    </form>
  );
}
