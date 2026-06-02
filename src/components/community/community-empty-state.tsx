// 커뮤니티 게시글이 없을 때의 빈 상태를 렌더링합니다.
import { MessagesSquare } from "lucide-react";

interface Props {
  message?: string;
}

export default function CommunityEmptyState({ message = "아직 작성된 글이 없어요." }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-2xl">
        <MessagesSquare className="size-7" />
      </div>
      <p className="text-muted-foreground text-sm font-semibold">{message}</p>
    </div>
  );
}
