// 채널 채팅 설정에서 반복 사용하는 선택 버튼을 렌더링합니다.

import { RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function ChatSettingOptionButton({ value, label, description, disabled }: Props) {
  return (
    <RadioGroupItem
      value={value}
      disabled={disabled}
      className={cn(
        "border-border bg-background text-foreground aspect-auto h-auto w-auto min-w-fit rounded-full px-4 py-2 text-left transition-colors",
        "inline-flex items-center justify-center gap-1",
        "hover:border-brand/40 hover:bg-brand/5 data-checked:border-brand/70 data-checked:bg-brand data-checked:text-brand-foreground data-checked:hover:bg-brand/90 data-checked:shadow-sm",
        "dark:data-checked:bg-brand! dark:data-checked:text-brand-foreground!",
        "[&_[data-slot=radio-group-indicator]]:hidden",
        description && "flex-col items-start rounded-xl py-3",
      )}
    >
      <span className="text-sm font-bold">{label}</span>
      {description ? (
        <span className="text-muted-foreground text-xs leading-5 text-pretty">{description}</span>
      ) : null}
    </RadioGroupItem>
  );
}
