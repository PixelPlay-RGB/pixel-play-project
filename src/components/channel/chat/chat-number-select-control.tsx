// 채팅 설정에서 숫자 옵션을 선택하는 드롭다운 컨트롤입니다.

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

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
  const selectedOption = options.find((option) => option.value === value) ?? options[0];
  const selectedValue = String(selectedOption.value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={ariaLabel}
            className={cn(
              "h-9 justify-between rounded-xl px-3 text-sm font-bold",
              compact ? "w-full sm:w-23" : "w-full sm:w-25",
            )}
          >
            <span className="truncate">{selectedOption.label}</span>
            <ChevronDown className="text-muted-foreground size-3.5 shrink-0" />
          </Button>
        )}
      />
      <DropdownMenuContent align="end" sideOffset={6} className="w-36">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{ariaLabel}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={selectedValue}
            onValueChange={(nextValue) => onChange(Number(nextValue))}
          >
            {options.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={String(option.value)} closeOnClick>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
