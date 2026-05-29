"use client";
// 채널 채팅 설정 화면의 폼 상호작용을 관리합니다.

import { ChatForbiddenWordsField } from "@/components/channel/chat/chat-forbidden-words-field";
import { ChatLinkBlockField } from "@/components/channel/chat/chat-link-block-field";
import { ChatRuleTextField } from "@/components/channel/chat/chat-rule-text-field";
import { ChatScopeField } from "@/components/channel/chat/chat-scope-field";
import { ChatSettingsCard } from "@/components/channel/chat/chat-settings-card";
import { ChatSlowModeField } from "@/components/channel/chat/chat-slow-mode-field";
import { ChatSummaryCard } from "@/components/channel/chat/chat-summary-card";
import { ChatWaitTimeField } from "@/components/channel/chat/chat-wait-time-field";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  CHANNEL_CHAT_FOLLOWER_WAIT_OPTIONS,
  CHANNEL_CHAT_SCOPE_OPTIONS,
  CHANNEL_CHAT_SLOW_MODE_OPTIONS,
} from "@/constants/channel/chat";
import { useChannelChatSettingsForm } from "@/hooks/channel/use-channel-chat-settings-form";
import type { ChannelChatSnapshot } from "@/types/channel/chat";
import { Gauge, MessageCircle, ShieldCheck } from "lucide-react";
import { Controller, useWatch } from "react-hook-form";

interface Props {
  initialSnapshot: ChannelChatSnapshot;
}

export function ChannelChatControls({ initialSnapshot }: Props) {
  const { form, snapshot, handleSubmit, isSaving } = useChannelChatSettingsForm(initialSnapshot);
  const {
    control,
    setValue,
    formState: { isDirty },
  } = form;
  const chatScope = useWatch({ control, name: "chatScope" }) ?? initialSnapshot.chatScope;
  const slowModeSeconds =
    useWatch({ control, name: "slowModeSeconds" }) ?? initialSnapshot.slowModeSeconds;
  const slowModeEnabled =
    useWatch({ control, name: "slowModeEnabled" }) ?? initialSnapshot.slowModeEnabled;
  const forbiddenWords =
    useWatch({ control, name: "forbiddenWords" }) ?? initialSnapshot.forbiddenWords;
  const linkBlocked = useWatch({ control, name: "linkBlocked" }) ?? initialSnapshot.linkBlocked;
  const followerWaitSeconds =
    useWatch({ control, name: "followerWaitSeconds" }) ?? initialSnapshot.followerWaitSeconds;
  const scopeLabel =
    CHANNEL_CHAT_SCOPE_OPTIONS.find((option) => option.value === chatScope)?.label ??
    "모든 로그인 유저";
  const waitLabel =
    CHANNEL_CHAT_FOLLOWER_WAIT_OPTIONS.find((option) => option.value === followerWaitSeconds)
      ?.label ?? "바로 가능";
  const slowModeLabel =
    CHANNEL_CHAT_SLOW_MODE_OPTIONS.find((option) => option.value === slowModeSeconds)?.label ??
    `${slowModeSeconds}초`;

  return (
    <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h1 className="text-foreground text-2xl leading-8 font-bold tracking-tight">채팅 설정</h1>
          <p className="text-muted-foreground text-sm leading-6 text-pretty">
            방송 채팅의 기본 정책과 금칙어를 관리합니다.
          </p>
        </div>
        <Button
          type="submit"
          disabled={isSaving || !isDirty}
          className="bg-brand hover:bg-brand/85 text-white sm:w-24"
        >
          {isSaving ? <Spinner /> : "저장"}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <ChatSummaryCard
          label="참여 범위"
          value={scopeLabel}
          description={chatScope === "follower" ? `${waitLabel} 뒤 채팅 가능` : "현재 참여 조건"}
          icon={<MessageCircle className="size-4" />}
          tone="brand"
        />
        <ChatSummaryCard
          label="저속 모드"
          value={slowModeEnabled ? slowModeLabel : "꺼짐"}
          description={slowModeEnabled ? "채팅 간격을 두고 받아요" : "연속 채팅을 바로 받아요"}
          icon={<Gauge className="size-4" />}
          tone={slowModeEnabled ? "live" : "default"}
        />
        <ChatSummaryCard
          label="채팅 보호"
          value={linkBlocked ? "링크 차단" : "링크 허용"}
          description={`금칙어 ${forbiddenWords.length}개 등록`}
          icon={<ShieldCheck className="size-4" />}
        />
      </div>

      <ChatSettingsCard
        title="채팅 기본값"
        description="방송 시작 시 적용할 채팅 참여 규칙입니다. 채팅 입력은 로그인한 시청자에게만 열려요."
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
            <ChatLinkBlockField value={field.value} disabled={isSaving} onChange={field.onChange} />
          )}
        />
      </ChatSettingsCard>

      <ChatSettingsCard
        title="채팅 규칙 안내문"
        description={`시청자가 처음 채팅하려 할 때 입력창 위 안내 컴포넌트에 표시됩니다.\n현재 규칙 버전은 v${snapshot.chatRuleVersion}이에요.`}
      >
        <Controller
          name="chatRuleText"
          control={control}
          render={({ field }) => (
            <ChatRuleTextField value={field.value} disabled={isSaving} onChange={field.onChange} />
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
    </form>
  );
}
