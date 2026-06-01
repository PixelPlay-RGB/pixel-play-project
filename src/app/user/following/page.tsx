// 팔로잉한 채널 목록 페이지를 렌더링합니다.
import FollowingChannelSection from "@/components/following/following-channel-section";

export default function UserFollowingPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-foreground text-2xl font-black tracking-tight">팔로잉</h1>
        <p className="text-muted-foreground text-sm">
          다시 보고 싶은 크리에이터와 지금 방송 중인 크리에이터를 한곳에서 확인하세요.
        </p>
      </header>

      <FollowingChannelSection />
    </div>
  );
}
