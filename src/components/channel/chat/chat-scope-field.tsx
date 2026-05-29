// 채팅 참여 범위 선택 필드를 렌더링합니다.

import { ChatSettingOptionButton } from "@/components/channel/chat/chat-setting-option-button";
import { CHANNEL_CHAT_SCOPE_OPTIONS } from "@/constants/channel/chat";
import type { LiveChatScope } from "@/types/channel/chat";

interface Props {
  value: LiveChatScope;
  disabled: boolean;
  onChange: (value: LiveChatScope) => void;
}

export function ChatScopeField({ value, disabled, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-1">
        <h3 className="text-foreground text-sm font-bold">참여 범위</h3>
        <p className="text-muted-foreground text-xs leading-5">
          누가 라이브 채팅에 참여할 수 있는지 정해요.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {CHANNEL_CHAT_SCOPE_OPTIONS.map((option) => (
          <ChatSettingOptionButton
            key={option.value}
            label={option.label}
            description={option.description}
            isSelected={value === option.value}
            disabled={disabled}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
    </div>
  );
}
