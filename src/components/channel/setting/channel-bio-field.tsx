// 채널 소개(bio) 입력 필드. Textarea + 글자수 카운터.

import { Textarea } from "@/components/ui/textarea";
import { CHANNEL_BIO_MAX } from "@/lib/zod/channel-profile";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function ChannelBioField({ value, disabled, onChange }: Props) {
  return (
    <label className="border-border bg-muted/40 focus-within:border-brand/50 focus-within:ring-brand/20 flex flex-col gap-3 rounded-xl border p-4 transition-colors focus-within:ring-3">
      <span className="text-muted-foreground text-xs font-semibold">채널 소개</span>
      <Textarea
        value={value}
        disabled={disabled}
        maxLength={CHANNEL_BIO_MAX}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-28 max-h-48 min-h-28 resize-none overflow-y-auto",
          "border-0 p-0 leading-6 shadow-none focus-visible:ring-0",
          "bg-transparent disabled:bg-transparent dark:bg-transparent dark:disabled:bg-transparent",
          "field-sizing-fixed",
        )}
        placeholder="내 채널을 소개하는 글을 적어보세요."
      />
      <span className="text-muted-foreground text-xs tabular-nums">
        {value.length} / {CHANNEL_BIO_MAX}
      </span>
    </label>
  );
}
