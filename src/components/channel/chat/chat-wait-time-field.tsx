// 팔로우 후 채팅 대기 시간 선택 필드를 렌더링합니다.

import { ChatFieldRow } from "@/components/channel/chat/chat-field-row";
import { ChatNumberSelectControl } from "@/components/channel/chat/chat-number-select-control";
import { CHANNEL_CHAT_FOLLOWER_WAIT_OPTIONS } from "@/constants/channel/chat";

interface Props {
  value: number;
  disabled: boolean;
  isActive: boolean;
  onChange: (value: number) => void;
}

export function ChatWaitTimeField({ value, disabled, isActive, onChange }: Props) {
  return (
    <ChatFieldRow label="팔로우 후 대기 시간" description="팔로워 채팅" isDimmed={!isActive}>
      <ChatNumberSelectControl
        ariaLabel="팔로우 후 대기 시간"
        value={value}
        options={CHANNEL_CHAT_FOLLOWER_WAIT_OPTIONS}
        disabled={disabled || !isActive}
        onChange={onChange}
      />
    </ChatFieldRow>
  );
}
