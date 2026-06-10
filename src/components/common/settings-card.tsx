// 설정 화면에서 반복되는 제목·설명·본문 카드를 렌더링합니다.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  title?: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SettingsCard({ title, description, children, className, contentClassName }: Props) {
  return (
    <Card className={cn("gap-5 py-6 shadow-sm", className)}>
      {title || description ? (
        <CardHeader className="gap-2 px-5 sm:px-6">
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description && (
            <CardDescription className="max-w-3xl leading-6 text-pretty whitespace-pre-line">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      ) : null}
      <CardContent className={cn("flex flex-col gap-5 px-5 sm:px-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
