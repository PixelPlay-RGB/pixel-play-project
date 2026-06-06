// 채널 채팅 설정 페이지의 서버 데이터를 조회합니다.
import "server-only";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { ChannelChatSnapshot } from "@/types/channel/chat";
import type { AppActionResult } from "@/types/common/action";
import { buildChannelChatSnapshot } from "@/utils/channel/channel-chat-snapshot";
import { getCreatorStudioSnapshot } from "@/utils/channel/creator-studio-snapshot";

export function getChannelChatSnapshot(): Promise<AppActionResult<ChannelChatSnapshot>> {
  return getCreatorStudioSnapshot({
    build: buildChannelChatSnapshot,
    loadFailedCode: APP_MESSAGE_CODE.error.channel.chatSettingsLoadFailed,
    logLabel: "채널 채팅 설정 조회",
  });
}
