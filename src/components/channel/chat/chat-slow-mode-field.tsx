// 저속 모드와 채팅 간격 선택 필드를 렌더링합니다.

import { ChatSettingOptionButton } from "@/components/channel/chat/chat-setting-option-button";
import { CHANNEL_CHAT_SLOW_MODE_OPTIONS } from "@/constants/channel/chat";
import { cn } from "@/lib/utils";

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
    <div className="flex flex-col gap-3">
      <div className="space-y-1">
        <h3 className="text-foreground text-sm font-bold">저속 모드</h3>
        <p className="text-muted-foreground text-xs leading-5">
          시청자가 채팅을 너무 빠르게 연속 입력하지 않도록 간격을 둬요.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <ChatSettingOptionButton
          label="켜기"
          description="정해둔 간격마다 한 번씩 채팅할 수 있어요."
          isSelected={enabled}
          disabled={disabled}
          onClick={() => onEnabledChange(true)}
        />
        <ChatSettingOptionButton
          label="끄기"
          description="시청자가 바로 이어서 채팅할 수 있어요."
          isSelected={!enabled}
          disabled={disabled}
          onClick={() => onEnabledChange(false)}
        />
      </div>
      <div
        className={cn(
          "grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7",
          !enabled && "opacity-60",
        )}
      >
        {CHANNEL_CHAT_SLOW_MODE_OPTIONS.map((option) => (
          <ChatSettingOptionButton
            key={option.value}
            label={option.label}
            isSelected={seconds === option.value}
            disabled={disabled || !enabled}
            onClick={() => onSecondsChange(option.value)}
          />
        ))}
      </div>
    </div>
  );
}
