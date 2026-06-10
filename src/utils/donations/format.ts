// 후원 도메인의 표시용 포맷팅 함수를 제공합니다.
export function formatPoint(value: number): string {
  return `${value.toLocaleString("ko-KR")}P`;
}
