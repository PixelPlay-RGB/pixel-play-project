// profile-card 컴포넌트를 제공합니다.
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  contentStyle?: string | undefined;
  footer?: ReactNode;
  footerStyle?: string | undefined;
}

export default function ProfileCard({ title, children, contentStyle, footer, footerStyle }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className={contentStyle}>{children}</CardContent>
      {footer && <CardFooter className={footerStyle}>{footer}</CardFooter>}
    </Card>
  );
}
