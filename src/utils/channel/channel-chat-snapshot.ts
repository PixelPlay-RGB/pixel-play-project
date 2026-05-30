// 채널 채팅 설정 snapshot의 화면 표시값을 조립합니다.
import "server-only";

import { CHANNEL_CHAT_DEFAULT_RULE_TEXT } from "@/constants/channel/chat";
import type { ChannelChatSnapshot, LiveChatScope } from "@/types/channel/chat";
import type { Json } from "@/types/database.types";

interface CreatorStudioSnapshotSettings {
  chatScope?: LiveChatScope;
  followerWaitSeconds?: number;
  slowModeEnabled?: boolean;
  slowModeSeconds?: number;
  linkBlocked?: boolean;
  forbiddenWords?: string[];
  chatRuleText?: string;
  chatRuleVersion?: number;
}

const LIVE_CHAT_SCOPE_SET = new Set<LiveChatScope>(["authenticated", "follower", "manager"]);

export function buildChannelChatSnapshot(creatorId: string, snapshot: Json): ChannelChatSnapshot {
  const settings = readSettings(snapshot);

  return {
    creatorId,
    chatScope: readChatScope(settings.chatScope),
    followerWaitSeconds: readNumber(settings.followerWaitSeconds, 0),
    slowModeEnabled: settings.slowModeEnabled ?? false,
    slowModeSeconds: readNumber(settings.slowModeSeconds, 3),
    linkBlocked: settings.linkBlocked ?? true,
    forbiddenWords: readForbiddenWords(settings.forbiddenWords),
    chatRuleText: readText(settings.chatRuleText, CHANNEL_CHAT_DEFAULT_RULE_TEXT),
    chatRuleVersion: readNumber(settings.chatRuleVersion, 1),
  };
}

function readSettings(snapshot: Json): CreatorStudioSnapshotSettings {
  const snapshotObject = readObject(snapshot);

  if (!snapshotObject) {
    return {};
  }

  const settings = readObject(snapshotObject.settings);

  return settings ? (settings as CreatorStudioSnapshotSettings) : {};
}

function readChatScope(value?: string): LiveChatScope {
  return value && LIVE_CHAT_SCOPE_SET.has(value as LiveChatScope)
    ? (value as LiveChatScope)
    : "authenticated";
}

function readNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readForbiddenWords(value?: string[]) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((word): word is string => typeof word === "string")
    .map((word) => word.trim())
    .filter((word, index, words) => word !== "" && words.indexOf(word) === index);
}

function readText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

function readObject(value: Json | undefined): Record<string, Json | undefined> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Json | undefined>;
}
