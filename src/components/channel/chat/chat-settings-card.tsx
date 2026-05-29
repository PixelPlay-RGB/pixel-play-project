// 채널 채팅 설정 섹션 카드를 렌더링합니다.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export function ChatSettingsCard({ title, description, children, className }: Props) {
  return (
    <Card className={cn("gap-5 rounded-xl shadow-sm", className)}>
      <CardHeader className="gap-2 px-5 sm:px-6">
        <CardTitle className="text-lg leading-7">{title}</CardTitle>
        <CardDescription className="max-w-2xl leading-6 text-pretty">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 px-5 sm:px-6">{children}</CardContent>
    </Card>
  );
}
