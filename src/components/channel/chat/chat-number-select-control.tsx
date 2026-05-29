// 채팅 설정에서 숫자 옵션을 선택하는 셀렉트 컨트롤입니다.

import { cn } from "@/lib/utils";

interface NumberOption {
  value: number;
  label: string;
}

interface Props {
  value: number;
  options: ReadonlyArray<NumberOption>;
  ariaLabel: string;
  disabled?: boolean;
  compact?: boolean;
  onChange: (value: number) => void;
}

export function ChatNumberSelectControl({
  value,
  options,
  ariaLabel,
  disabled,
  compact,
  onChange,
}: Props) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value))}
      className={cn(
        "border-border bg-background text-foreground h-11 rounded-xl border px-4 text-sm font-bold shadow-sm transition-colors outline-none",
        "focus-visible:border-brand focus-visible:ring-brand/15 focus-visible:ring-3",
        "disabled:pointer-events-none disabled:opacity-50",
        compact ? "w-full sm:w-32" : "w-full sm:w-56",
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
