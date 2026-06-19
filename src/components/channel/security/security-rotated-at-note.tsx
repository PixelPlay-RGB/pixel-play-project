// 보안 토큰(스트림 키·OBS URL)의 마지막 재발급 시각을 표시합니다.
// 재발급 이력이 없으면(null) 아무것도 렌더하지 않습니다.
import { formatKstDateTimeNumeric } from "@/utils/common/date";
import { History } from "lucide-react";

export function SecurityRotatedAtNote({ rotatedAt }: { rotatedAt: string | null }) {
  if (!rotatedAt) {
    return null;
  }

  return (
    <p className="text-muted-foreground mt-3 flex items-center gap-1 text-xs">
      <History className="size-3 shrink-0" />
      마지막 재발급: {formatKstDateTimeNumeric(rotatedAt)}
    </p>
  );
}
