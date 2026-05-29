// 저속 모드와 채팅 간격 선택 필드를 렌더링합니다.

import { ChatFieldRow } from "@/components/channel/chat/chat-field-row";
import { ChatNumberSelectControl } from "@/components/channel/chat/chat-number-select-control";
import { ChatToggleControl } from "@/components/channel/chat/chat-toggle-control";
import { CHANNEL_CHAT_SLOW_MODE_OPTIONS } from "@/constants/channel/chat";

interface Props {
  enabled: boolean;
  seconds: number;
  disabled: boolean;
  onEnabledChange: (value: boolean) => void;
  onSecondsChange: (value: number) => void;
}

export function ChatSlowModeField({
  enabled,
  seconds,
  disabled,
  onEnabledChange,
  onSecondsChange,
}: Props) {
  return (
    <ChatFieldRow label="저속 모드" description="채팅 간격">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <ChatToggleControl
          checked={enabled}
          checkedLabel="ON"
          uncheckedLabel="OFF"
          disabled={disabled}
          onChange={onEnabledChange}
        />
        <ChatNumberSelectControl
          ariaLabel="저속 모드 채팅 간격"
          value={seconds}
          options={CHANNEL_CHAT_SLOW_MODE_OPTIONS}
          disabled={disabled || !enabled}
          compact
          onChange={onSecondsChange}
        />
      </div>
    </ChatFieldRow>
  );
}
