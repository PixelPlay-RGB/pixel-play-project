// 채팅 참여 범위 선택 필드를 렌더링합니다.

import { ChatFieldRow } from "@/components/channel/chat/chat-field-row";
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
    <ChatFieldRow label="참여 범위" description="입력 권한">
      <div className="flex flex-wrap gap-2">
        {CHANNEL_CHAT_SCOPE_OPTIONS.map((option) => (
          <ChatSettingOptionButton
            key={option.value}
            label={option.label}
            isSelected={value === option.value}
            disabled={disabled}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
    </ChatFieldRow>
  );
}
