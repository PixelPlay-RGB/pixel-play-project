// 커뮤니티 목록 페이지 진입/전환 시 콘텐츠 슬롯 로딩 스켈레톤.
import CommunityPostListSkeleton from "@/components/community/community-post-list-skeleton";

export default function Loading() {
  return (
    <section className="flex flex-col gap-4">
      <CommunityPostListSkeleton />
    </section>
  );
}
