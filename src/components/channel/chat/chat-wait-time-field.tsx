// 팔로잉 후 채팅 대기 시간 선택 필드를 렌더링합니다.

import { ChatSettingOptionButton } from "@/components/channel/chat/chat-setting-option-button";
import { CHANNEL_CHAT_FOLLOWER_WAIT_OPTIONS } from "@/constants/channel/chat";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  disabled: boolean;
  isActive: boolean;
  onChange: (value: number) => void;
}

export function ChatWaitTimeField({ value, disabled, isActive, onChange }: Props) {
  return (
    <div className={cn("flex flex-col gap-3", !isActive && "opacity-60")}>
      <div className="space-y-1">
        <h3 className="text-foreground text-sm font-bold">팔로잉 후 대기 시간</h3>
        <p className="text-muted-foreground text-xs leading-5">
          팔로잉한 직후 바로 채팅할 수 있을지 정해요.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-5">
        {CHANNEL_CHAT_FOLLOWER_WAIT_OPTIONS.map((option) => (
          <ChatSettingOptionButton
            key={option.value}
            label={option.label}
            isSelected={value === option.value}
            disabled={disabled || !isActive}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
    </div>
  );
}
