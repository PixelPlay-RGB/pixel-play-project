/**
 * 채팅만 뷰포트 안에 고정(헤더·푸터 영역 제외). 값은 Header/Footer 높이에 맞춰 조정 가능.
 */
export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="h-app-content min-h-0 w-full overflow-hidden">{children}</div>;
}
