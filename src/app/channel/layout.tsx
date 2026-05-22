// 채널 관리 페이지 레이아웃을 구성합니다.
import ChannelShell from "@/components/channel/channel-shell";
import { ReactNode } from "react";

export default function ChannelLayout({ children }: { children: ReactNode }) {
  return <ChannelShell>{children}</ChannelShell>;
}
