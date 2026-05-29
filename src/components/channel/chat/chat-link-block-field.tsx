// 채팅 링크 차단 여부 선택 필드를 렌더링합니다.

import { ChatSettingOptionButton } from "@/components/channel/chat/chat-setting-option-button";
import { CHANNEL_CHAT_LINK_BLOCK_OPTIONS } from "@/constants/channel/chat";

interface Props {
  value: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}

export function ChatLinkBlockField({ value, disabled, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-1">
        <h3 className="text-foreground text-sm font-bold">외부 링크</h3>
        <p className="text-muted-foreground text-xs leading-5">
          URL이 포함된 메시지를 보낼 수 있을지 정해요.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {CHANNEL_CHAT_LINK_BLOCK_OPTIONS.map((option) => (
          <ChatSettingOptionButton
            key={String(option.value)}
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
