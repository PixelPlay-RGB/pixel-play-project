// 첫 채팅 전 규칙 안내문 입력 필드를 렌더링합니다.

import { Textarea } from "@/components/ui/textarea";
import { CHANNEL_CHAT_RULE_MAX_LENGTH } from "@/constants/channel/chat";

interface Props {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function ChatRuleTextField({ value, disabled, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-1">
        <h3 className="text-foreground text-sm font-bold">첫 채팅 전 안내문</h3>
        <p className="text-muted-foreground text-xs leading-5">
          시청자가 처음 채팅하려 할 때 입력창 위에 보여줄 문장이에요.
        </p>
      </div>
      <Textarea
        value={value}
        disabled={disabled}
        maxLength={CHANNEL_CHAT_RULE_MAX_LENGTH}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 resize-none leading-6"
        placeholder="채팅 규칙을 입력해주세요."
      />
      <div className="text-muted-foreground flex justify-between gap-3 text-xs">
        <span>짧고 분명한 문장이 시청자에게 가장 잘 전달돼요.</span>
        <span className="shrink-0">
          {value.length} / {CHANNEL_CHAT_RULE_MAX_LENGTH}
        </span>
      </div>
    </div>
  );
}
