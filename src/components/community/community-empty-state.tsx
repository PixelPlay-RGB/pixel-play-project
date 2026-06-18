// 커뮤니티 게시글이 없을 때의 빈 상태를 렌더링합니다(공용 EmptyState 위임).
import { MessagesSquare } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";

interface Props {
  message?: string;
}

export default function CommunityEmptyState({ message = "아직 작성된 글이 없어요." }: Props) {
  return <EmptyState icon={<MessagesSquare className="size-7" />} title={message} />;
}
