// 설정 화면에서 이진 옵션을 바꾸는 스위치형 버튼입니다.

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  checked: boolean;
  checkedLabel: string;
  uncheckedLabel: string;
  disabled?: boolean;
  ariaLabel?: string;
  onChange: (checked: boolean) => void;
}

export function SettingToggleControl({
  checked,
  checkedLabel,
  uncheckedLabel,
  disabled,
  ariaLabel,
  onChange,
}: Props) {
  return (
    <Button
      type="button"
      variant="outline"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "border-border bg-background text-muted-foreground inline-flex h-9 items-center gap-3 rounded-full border px-3 text-sm font-bold shadow-sm transition-colors",
        "hover:border-brand/40 hover:bg-brand/5 disabled:pointer-events-none disabled:opacity-50",
        checked && "border-brand/40 bg-brand/10 text-brand",
      )}
    >
      <span>{checked ? checkedLabel : uncheckedLabel}</span>
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </span>
    </Button>
  );
}
