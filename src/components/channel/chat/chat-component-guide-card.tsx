// 채팅 메시지와 안내 컴포넌트의 분리 원칙을 안내합니다.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ChatComponentGuideCard() {
  return (
    <Card className="border-brand/30 bg-brand/5 gap-4 shadow-sm">
      <CardHeader className="gap-2 px-5 sm:px-6">
        <CardTitle>메시지와 컴포넌트 분리</CardTitle>
        <CardDescription className="leading-6 text-pretty">
          클린봇이 가린 채팅은 메시지 타입으로 남기고, 입장 안내와 규칙 확인 안내는 현재
          사용자에게만 보여주는 UI 컴포넌트로 표시합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 sm:px-6">
        <p className="text-muted-foreground text-xs leading-5 text-pretty">
          로그인, 팔로잉, 규칙 확인 안내는 DB 설정을 읽어 필요한 시청자에게만 보여주세요.
        </p>
      </CardContent>
    </Card>
  );
}
