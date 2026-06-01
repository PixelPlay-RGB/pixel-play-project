// 채팅 설정에서 숫자 옵션을 선택하는 Select 컨트롤입니다.

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectLabel,
  SelectList,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  if (options.length === 0) {
    return null;
  }

  const selectedOption = options.find((option) => option.value === value) ?? options[0];
  const selectedValue = String(selectedOption.value);

  return (
    <Select
      value={selectedValue}
      items={options.map((option) => ({ label: option.label, value: String(option.value) }))}
      disabled={disabled}
      onValueChange={(nextValue) => onChange(Number(nextValue))}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn("w-full", compact ? "sm:w-28" : "sm:w-36")}
      >
        <SelectValue placeholder={selectedOption.label} />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{ariaLabel}</SelectLabel>
          <SelectList>
            {options.map((option) => (
              <SelectItem key={option.value} value={String(option.value)} label={option.label}>
                {option.label}
              </SelectItem>
            ))}
          </SelectList>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
