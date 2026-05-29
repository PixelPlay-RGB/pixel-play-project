// 채팅 설정에서 이진 옵션을 바꾸는 스위치형 버튼입니다.

import { cn } from "@/lib/utils";

interface Props {
  checked: boolean;
  checkedLabel: string;
  uncheckedLabel: string;
  disabled?: boolean;
  ariaLabel?: string;
  onChange: (checked: boolean) => void;
}

export function ChatToggleControl({
  checked,
  checkedLabel,
  uncheckedLabel,
  disabled,
  ariaLabel,
  onChange,
}: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "border-border bg-background text-muted-foreground inline-flex h-11 items-center gap-3 rounded-full border px-4 text-sm font-bold shadow-sm transition-colors",
        "hover:border-brand/40 hover:bg-brand/5 disabled:pointer-events-none disabled:opacity-50",
        checked && "border-brand/40 bg-brand/10 text-brand",
      )}
    >
      <span>{checked ? checkedLabel : uncheckedLabel}</span>
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-brand/80" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "bg-background absolute top-0.5 size-5 rounded-full shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
