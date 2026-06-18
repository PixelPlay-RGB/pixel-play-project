// 모든 설정 화면의 공통 골격(헤더 + 본문)을 렌더링합니다.

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  kicker: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SettingsPage({ kicker, title, description, action, children, className }: Props) {
  return (
    <main className={cn("mx-auto flex w-full max-w-480 flex-col gap-7", className)}>
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-2">
          <span className="text-brand text-sm font-bold">{kicker}</span>
          <h1 className="text-foreground text-3xl leading-tight font-bold tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground max-w-2xl text-sm leading-6 text-pretty">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </section>

      {children}
    </main>
  );
}
