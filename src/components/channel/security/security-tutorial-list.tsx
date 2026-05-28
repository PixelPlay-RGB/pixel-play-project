// OBS 보안 정보 카드 하단의 짧은 사용 안내를 렌더링합니다.
export function SecurityTutorialList({ items }: { items: string[] }) {
  return (
    <ul className="border-border/70 text-muted-foreground mt-4 grid gap-2 border-t pt-3 text-sm leading-6">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className="bg-brand mt-2.5 size-1.5 shrink-0 rounded-full" />
          <span className="text-pretty">{item}</span>
        </li>
      ))}
    </ul>
  );
}
