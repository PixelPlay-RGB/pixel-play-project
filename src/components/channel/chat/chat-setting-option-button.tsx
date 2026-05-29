// 채널 채팅 설정에서 반복 사용하는 선택 버튼을 렌더링합니다.

import { cn } from "@/lib/utils";

interface Props {
  label: string;
  description?: string;
  isSelected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function ChatSettingOptionButton({
  label,
  description,
  isSelected,
  disabled,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "border-border bg-background text-foreground inline-flex min-h-10 items-center justify-center gap-1 rounded-full border px-4 py-2 text-left transition-colors",
        "hover:border-brand/40 hover:bg-brand/5 disabled:pointer-events-none disabled:opacity-50",
        isSelected && "border-brand/50 bg-brand/10 text-brand ring-brand/15 ring-3",
        description && "flex-col items-start rounded-xl py-3",
      )}
    >
      <span className="text-sm font-bold">{label}</span>
      {description ? (
        <span className="text-muted-foreground text-xs leading-5 text-pretty">{description}</span>
      ) : null}
    </button>
  );
}
