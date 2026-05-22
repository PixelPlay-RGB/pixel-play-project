// 채팅방 상세 화면을 헤더 아래 뷰포트에 고정합니다.
export default function ChatRoomLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="h-chat-content min-h-0 w-full overflow-hidden">{children}</div>;
}
