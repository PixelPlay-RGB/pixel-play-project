// 채널 채팅 설정 화면에서 사용하는 타입을 정의합니다.

import type { Database } from "@/types/database.types";

export type LiveChatScope = Database["public"]["Enums"]["live_chat_scope"];

export interface ChannelChatSnapshot {
  creatorId: string;
  chatScope: LiveChatScope;
  followerWaitSeconds: number;
  slowModeEnabled: boolean;
  slowModeSeconds: number;
  linkBlocked: boolean;
  forbiddenWords: string[];
  chatRuleText: string;
  chatRuleVersion: number;
}
