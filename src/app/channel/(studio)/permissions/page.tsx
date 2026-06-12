// 채널 권한 관리(매니저) 페이지. 크리에이터 본인만 접근하는 스튜디오 화면이라 서버에서 인증을 가드한다.
import { ChannelPermissionsPageContent } from "@/components/channel/moderation/channel-permissions-page-content";
import { LoadFailedState } from "@/components/common/load-failed-state";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { getCurrentProfileSnapshot } from "@/utils/profile/profile-server";

export default async function ChannelPermissionsPage() {
  const { profile } = await getCurrentProfileSnapshot();

  if (!profile) {
    return <LoadFailedState code={APP_MESSAGE_CODE.error.auth.authInfoNotFound} />;
  }

  return (
    <ChannelPermissionsPageContent
      creator={{ id: profile.id, nickname: profile.nickname, photoUrl: profile.photo_url }}
    />
  );
}
