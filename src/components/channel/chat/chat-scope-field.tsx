// 채팅 참여 범위 선택 필드를 렌더링합니다.

import { SettingFieldRow } from "@/components/common/setting-field-row";
import { ChatSettingOptionButton } from "@/components/channel/chat/chat-setting-option-button";
import { RadioGroup } from "@/components/ui/radio-group";
import { CHANNEL_CHAT_SCOPE_OPTIONS } from "@/constants/channel/chat";
import type { LiveChatScope } from "@/types/channel/chat";

interface Props {
  value: LiveChatScope;
  disabled: boolean;
  onChange: (value: LiveChatScope) => void;
}

const CHAT_SCOPE_VALUES: readonly string[] = CHANNEL_CHAT_SCOPE_OPTIONS.map(
  (option) => option.value,
);

function isLiveChatScope(value: string): value is LiveChatScope {
  return CHAT_SCOPE_VALUES.includes(value);
}

export function ChatScopeField({ value, disabled, onChange }: Props) {
  return (
    <SettingFieldRow label="참여 범위" description="입력 권한">
      <RadioGroup
        value={value}
        className="flex w-auto flex-wrap gap-2"
        onValueChange={(nextValue) => {
          if (isLiveChatScope(nextValue)) {
            onChange(nextValue);
          }
        }}
      >
        {CHANNEL_CHAT_SCOPE_OPTIONS.map((option) => (
          <ChatSettingOptionButton
            key={option.value}
            value={option.value}
            label={option.label}
            disabled={disabled}
          />
        ))}
      </RadioGroup>
    </SettingFieldRow>
  );
}
