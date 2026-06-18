// 채널 시청자 관리(강퇴/제재 이력) 페이지. 크리에이터·매니저가 접근하는 스튜디오 화면이라 서버에서 인증을 가드한다.
import { ChannelViewersPageContent } from "@/components/channel/moderation/channel-viewers-page-content";
import { LoadFailedState } from "@/components/common/load-failed-state";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { getCurrentProfileSnapshot } from "@/utils/profile/profile-server";

export default async function ChannelViewersPage() {
  const { profile } = await getCurrentProfileSnapshot();

  if (!profile) {
    return <LoadFailedState code={APP_MESSAGE_CODE.error.auth.authInfoNotFound} />;
  }

  return <ChannelViewersPageContent creatorId={profile.id} />;
}
