// 커뮤니티 게시글 카드 목록을 렌더링합니다.
import CommunityPostCard from "@/components/community/community-post-card";
import type { CommunityCreator, CommunityPost } from "@/types/community/community";

interface Props {
  creatorId: string;
  creator: CommunityCreator;
  posts: CommunityPost[];
}

export default function CommunityPostList({ creatorId, creator, posts }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {posts.map((post) => (
        <CommunityPostCard key={post.id} creatorId={creatorId} creator={creator} post={post} />
      ))}
    </div>
  );
}
