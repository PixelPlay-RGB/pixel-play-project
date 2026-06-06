// 채널 후원 설정 페이지의 서버 데이터를 조회합니다.
import "server-only";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { ChannelDonationSnapshot } from "@/types/channel/donation";
import type { AppActionResult } from "@/types/common/action";
import { buildChannelDonationSnapshot } from "@/utils/channel/channel-donation-snapshot";
import { getCreatorStudioSnapshot } from "@/utils/channel/creator-studio-snapshot";

export function getChannelDonationSnapshot(): Promise<AppActionResult<ChannelDonationSnapshot>> {
  return getCreatorStudioSnapshot({
    build: buildChannelDonationSnapshot,
    loadFailedCode: APP_MESSAGE_CODE.error.channel.donationSettingsLoadFailed,
    logLabel: "채널 후원 설정 조회",
  });
}
