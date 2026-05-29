// 채팅 링크 차단 여부 선택 필드를 렌더링합니다.

import { ChatFieldRow } from "@/components/channel/chat/chat-field-row";
import { ChatToggleControl } from "@/components/channel/chat/chat-toggle-control";

interface Props {
  value: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}

export function ChatLinkBlockField({ value, disabled, onChange }: Props) {
  return (
    <ChatFieldRow label="링크 허용" description="외부 URL">
      <ChatToggleControl
        checked={!value}
        checkedLabel="링크 허용"
        uncheckedLabel="링크 차단"
        ariaLabel="외부 링크 허용"
        disabled={disabled}
        onChange={(isAllowed) => onChange(!isAllowed)}
      />
    </ChatFieldRow>
  );
}
