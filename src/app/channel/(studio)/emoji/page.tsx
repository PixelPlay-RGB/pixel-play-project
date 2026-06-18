// 채널 이모지 등록 페이지. 크리에이터 본인만 접근하는 스튜디오 화면이라 서버에서 인증을 가드한다.
import { ChannelEmojiPageContent } from "@/components/channel/emoji/channel-emoji-page-content";
import { LoadFailedState } from "@/components/common/load-failed-state";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { getChannelEmojis } from "@/utils/channel/channel-emoji-server";
import { getCurrentProfileSnapshot } from "@/utils/profile/profile-server";

export default async function ChannelEmojiPage() {
  const { profile } = await getCurrentProfileSnapshot();

  if (!profile) {
    return <LoadFailedState code={APP_MESSAGE_CODE.error.auth.authInfoNotFound} />;
  }

  const emojis = await getChannelEmojis(profile.id);

  return <ChannelEmojiPageContent initialEmojis={emojis} />;
}
