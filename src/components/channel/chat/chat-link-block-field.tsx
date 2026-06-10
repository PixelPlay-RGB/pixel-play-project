// 채팅 링크 차단 여부 선택 필드를 렌더링합니다.

import { SettingFieldRow } from "@/components/common/setting-field-row";
import { SettingToggleControl } from "@/components/common/setting-toggle-control";

interface Props {
  value: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}

export function ChatLinkBlockField({ value, disabled, onChange }: Props) {
  return (
    <SettingFieldRow label="링크 허용" description="외부 URL">
      <SettingToggleControl
        checked={value}
        checkedLabel="ON"
        uncheckedLabel="OFF"
        ariaLabel="외부 링크 차단"
        disabled={disabled}
        onChange={onChange}
      />
    </SettingFieldRow>
  );
}
