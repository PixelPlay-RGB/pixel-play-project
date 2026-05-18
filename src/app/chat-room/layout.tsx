// 라우트 레이아웃을 구성합니다.
/**
 * 채팅 화면을 헤더 아래 뷰포트에 고정한다.
 */
export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="h-chat-content min-h-0 w-full overflow-hidden">{children}</div>;
}
