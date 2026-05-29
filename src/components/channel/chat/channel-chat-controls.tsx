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

  return (
    <form onSubmit={handleSubmit} className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between xl:col-span-2">
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

      <div className="flex min-w-0 flex-col gap-5">
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

      <aside className="bg-card text-card-foreground h-fit rounded-xl border p-5 shadow-sm xl:sticky xl:top-6">
        <div className="space-y-2">
          <h2 className="text-foreground text-sm font-extrabold">메시지와 컴포넌트 분리</h2>
          <p className="text-muted-foreground text-sm leading-6 text-pretty">
            클린봇이 가린 채팅은 메시지 타입으로 남겨요.
            <br />
            입장 안내, 로그인, 팔로잉, 규칙 확인 안내는 DB 설정을 읽어 현재 사용자에게만 보여주는 UI
            컴포넌트로 표시합니다.
          </p>
          <p className="text-muted-foreground text-xs leading-5">
            현재 규칙 버전은{" "}
            <span className="text-foreground font-bold">v{snapshot.chatRuleVersion}</span>이에요.
          </p>
        </div>
      </aside>
    </form>
  );
}
