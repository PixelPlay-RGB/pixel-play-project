// 첫 채팅 전 규칙 안내문 입력 필드를 렌더링합니다.

import { HintNote } from "@/components/common/hint-note";
import { Textarea } from "@/components/ui/textarea";
import { CHANNEL_CHAT_RULE_MAX_LENGTH } from "@/constants/channel/chat";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function ChatRuleTextField({ value, disabled, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <label className="border-border bg-muted/40 focus-within:border-brand/50 focus-within:ring-brand/20 flex flex-col gap-3 rounded-xl border p-4 transition-colors focus-within:ring-3">
        <span className="text-muted-foreground text-xs font-semibold">안내문</span>
        <Textarea
          value={value}
          disabled={disabled}
          maxLength={CHANNEL_CHAT_RULE_MAX_LENGTH}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "h-28 max-h-40 min-h-28 resize-none overflow-y-auto",
            "border-0 p-0 leading-6 shadow-none focus-visible:ring-0",
            "bg-transparent disabled:bg-transparent dark:bg-transparent dark:disabled:bg-transparent",
            "field-sizing-fixed",
          )}
          placeholder="채팅 규칙을 입력해주세요."
        />
        <span className="text-muted-foreground text-xs">
          {value.length} / {CHANNEL_CHAT_RULE_MAX_LENGTH}
        </span>
      </label>
      <HintNote>
        첫 채팅 전 규칙 확인은 항상 적용돼요.
        <br />
        시청자는 확인 후 채팅할 수 있어요.
      </HintNote>
    </div>
  );
}
