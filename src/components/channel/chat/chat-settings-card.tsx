// 채널 채팅 설정 섹션 카드를 렌더링합니다.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}

export function ChatSettingsCard({ icon: Icon, title, description, children }: Props) {
  return (
    <Card className="gap-5 shadow-sm">
      <CardHeader className="gap-2 px-5 sm:px-6">
        <CardTitle className="flex items-center gap-2">
          <Icon className="text-brand size-4" />
          {title}
        </CardTitle>
        <CardDescription className="max-w-xl leading-6 text-pretty">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 px-5 sm:px-6">{children}</CardContent>
    </Card>
  );
}
