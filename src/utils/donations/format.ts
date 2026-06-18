// 후원 도메인의 표시용 포맷팅 함수를 제공합니다.
import { formatNumber } from "@/utils/common/format";

export function formatPoint(value: number): string {
  return `${formatNumber(value)}P`;
}
