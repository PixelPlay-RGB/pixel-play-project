// 저속 모드와 채팅 간격 선택 필드를 렌더링합니다.

import { SettingFieldRow } from "@/components/common/setting-field-row";
import { SettingNumberSelectControl } from "@/components/common/setting-number-select-control";
import { SettingToggleControl } from "@/components/common/setting-toggle-control";
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
    <SettingFieldRow label="저속 모드" description="채팅 간격">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SettingToggleControl
          checked={enabled}
          checkedLabel="ON"
          uncheckedLabel="OFF"
          ariaLabel="저속 모드 사용"
          disabled={disabled}
          onChange={onEnabledChange}
        />
        <SettingNumberSelectControl
          ariaLabel="저속 모드 채팅 간격"
          value={seconds}
          options={CHANNEL_CHAT_SLOW_MODE_OPTIONS}
          disabled={disabled || !enabled}
          compact
          onChange={onSecondsChange}
        />
      </div>
    </SettingFieldRow>
  );
}
