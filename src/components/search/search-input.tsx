// 검색어 입력에 사용하는 공통 입력 UI를 렌더링합니다.
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { SubmitEvent } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = "검색어를 입력하세요",
  className,
  disabled = false,
}: Props) {
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)}>
      <Search
        className={cn(
          "text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2",
          disabled && "opacity-50",
        )}
      />
      <Input
        type="search"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-9 rounded-full pr-3 pl-9 text-sm",
          "bg-background/80 border-brand/20 focus-visible:border-brand/50 focus-visible:ring-brand/30",
          "dark:border-border dark:bg-background/70",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      />
    </form>
  );
}
