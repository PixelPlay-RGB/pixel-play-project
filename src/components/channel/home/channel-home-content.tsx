// 채널 홈 탭: Live Hero + 배너 줄 + 커뮤니티 미리보기.
import { ChannelBannerRow } from "@/components/channel/home/channel-banner-row";
import { ChannelCommunityPreview } from "@/components/channel/home/channel-community-preview";
import { ChannelHomeHero } from "@/components/channel/home/channel-home-hero";
import type { ChannelBanner, ChannelProfile } from "@/types/channel/channel";
import type { CommunityPostsResult } from "@/types/community/community";
import type { LiveHeroItem } from "@/types/live/live";

interface Props {
  creatorId: string;
  profile: ChannelProfile;
  hero: LiveHeroItem | null;
  banners: ChannelBanner[];
  community: CommunityPostsResult | null;
}

export function ChannelHomeContent({ creatorId, profile, hero, banners, community }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <ChannelHomeHero hero={hero} creatorNickname={profile.nickname} />
      <ChannelBannerRow banners={banners} />
      <ChannelCommunityPreview
        creatorId={creatorId}
        isOwner={profile.isOwnChannel}
        result={community}
      />
    </div>
  );
}
