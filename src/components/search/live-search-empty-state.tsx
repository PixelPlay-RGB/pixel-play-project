// 라이브 검색의 빈 상태를 렌더링합니다(공용 EmptyState·차분한 muted 톤에 위임).
// tone은 아이콘 선택에만 쓰고, 색 강조는 하지 않는다(빈 상태는 muted 한 가지로 통일).
import { Radio, Search } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";

interface Props {
  message: string;
  title: string;
  tone?: "brand" | "live";
}

export default function LiveSearchEmptyState({ message, title, tone = "live" }: Props) {
  const Icon = tone === "live" ? Radio : Search;

  return (
    <div className="flex min-h-120 w-full items-center justify-center">
      <EmptyState icon={<Icon className="size-7" />} title={title} description={message} />
    </div>
  );
}
