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
      <label className="border-border bg-background flex flex-col gap-3 rounded-xl border p-4">
        <span className="text-foreground text-sm font-bold">안내문</span>
        <Textarea
          value={value}
          disabled={disabled}
          maxLength={CHANNEL_CHAT_RULE_MAX_LENGTH}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-28 resize-none border-0 bg-transparent p-0 leading-6 shadow-none focus-visible:ring-0"
          placeholder="채팅 규칙을 입력해주세요."
        />
        <span className="text-muted-foreground text-xs">
          {value.length} / {CHANNEL_CHAT_RULE_MAX_LENGTH}
        </span>
      </label>
      <div className="bg-brand/10 text-muted-foreground rounded-xl p-3 text-xs leading-5">
        <p>
          첫 채팅 전 규칙 확인은 항상 적용돼요.
          <br className="sm:hidden" />
          시청자는 확인 후 채팅할 수 있어요.
        </p>
      </div>
    </div>
  );
}
