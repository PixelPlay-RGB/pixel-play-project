// 보조 안내(팁) 카드 안에 단계별 가이드를 나열하는 항목입니다.

interface SideTipStepProps {
  number: string;
  title: string;
  description: string;
}

export function SideTipStep({ number, title, description }: SideTipStepProps) {
  return (
    <div className="flex gap-3">
      <span className="bg-brand/10 text-brand flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
        {number}
      </span>
      <div className="min-w-0 space-y-1">
        <strong className="text-foreground block text-sm leading-5 text-pretty">{title}</strong>
        <p className="text-muted-foreground text-xs leading-5 text-pretty whitespace-pre-line">
          {description}
        </p>
      </div>
    </div>
  );
}
