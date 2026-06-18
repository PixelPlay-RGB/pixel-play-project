// 채널 보안 설정 페이지의 서버 데이터를 조회합니다.
import "server-only";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { ChannelSecuritySnapshot } from "@/types/channel/security";
import type { AppActionResult } from "@/types/common/action";
import { buildChannelSecuritySnapshot } from "@/utils/channel/channel-security-snapshot";
import { getCreatorStudioSnapshot } from "@/utils/channel/creator-studio-snapshot";

export function getChannelSecuritySnapshot(): Promise<AppActionResult<ChannelSecuritySnapshot>> {
  return getCreatorStudioSnapshot({
    build: buildChannelSecuritySnapshot,
    loadFailedCode: APP_MESSAGE_CODE.error.channel.securityLoadFailed,
    logLabel: "채널 보안 설정 조회",
  });
}
