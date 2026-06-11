// 공개 채널 홈 탭: Live Hero(오프라인 안내) + 배너 + 커뮤니티 최신 12개(캐러셀).
import { notFound } from "next/navigation";

import { ChannelHomeContent } from "@/components/channel/home/channel-home-content";
import { resolveViewerId } from "@/utils/auth/viewer";
import { getChannelBanners, getChannelLiveHero } from "@/utils/channel/channel-extras-server";
import { getChannelProfile } from "@/utils/channel/channel-server";
import { getChannelCommunityPosts } from "@/utils/community/community-server";

const HOME_COMMUNITY_PREVIEW_COUNT = 12;

export default async function ChannelHomePage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;

  const profileResult = await getChannelProfile(creatorId);

  if (!profileResult.success || !profileResult.data) {
    notFound();
  }

  const profile = profileResult.data;

  const viewerId = await resolveViewerId();
  const [hero, banners, postsResult] = await Promise.all([
    profile.isLive ? getChannelLiveHero(creatorId, viewerId) : Promise.resolve(null),
    getChannelBanners(creatorId),
    getChannelCommunityPosts(creatorId, 1, HOME_COMMUNITY_PREVIEW_COUNT),
  ]);

  const community = postsResult.success && postsResult.data ? postsResult.data : null;

  return (
    <ChannelHomeContent
      creatorId={creatorId}
      profile={profile}
      hero={hero}
      banners={banners}
      community={community}
    />
  );
}
