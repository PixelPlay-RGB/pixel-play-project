// 방송 운영 입력값 검증 스키마를 정의합니다.

import {
  CHANNEL_CHAT_FOLLOWER_WAIT_OPTIONS,
  CHANNEL_CHAT_FORBIDDEN_WORD_MAX_COUNT,
  CHANNEL_CHAT_FORBIDDEN_WORD_MAX_LENGTH,
  CHANNEL_CHAT_RULE_MAX_LENGTH,
  CHANNEL_CHAT_SLOW_MODE_OPTIONS,
} from "@/constants/channel/chat";
import { z } from "zod";

// 클라(channel-chat.ts)와 동일한 옵션 상수에서 파생해 클라 통과/서버 거절 드리프트를 막는다.
const followerWaitValueSet = new Set<number>(
  CHANNEL_CHAT_FOLLOWER_WAIT_OPTIONS.map((option) => option.value),
);
const slowModeValueSet = new Set<number>(
  CHANNEL_CHAT_SLOW_MODE_OPTIONS.map((option) => option.value),
);

const followerWaitSecondsSchema = z
  .number()
  .int()
  .refine((value) => followerWaitValueSet.has(value));

const slowModeSecondsSchema = z
  .number()
  .int()
  .refine((value) => slowModeValueSet.has(value));

export const startLiveBroadcastSchema = z.object({
  tags: z.array(z.string().trim().min(1).max(12)).max(5),
  thumbnailUrl: z.url().nullable().optional(),
  title: z.string().trim().min(1).max(100),
});

export const updateChannelLiveSettingsSchema = z.object({
  alertSoundEnabled: z.boolean(),
  alertVolume: z.number().int().min(0).max(100),
  chatDonationMessageEnabled: z.boolean(),
  chatRuleText: z.string().max(CHANNEL_CHAT_RULE_MAX_LENGTH),
  chatScope: z.enum(["authenticated", "follower", "manager"]),
  donationAlertDurationSeconds: z.number().int().min(3).max(30),
  donationAmountVisible: z.boolean(),
  donationEnabled: z.boolean(),
  donationMinAmount: z.number().int().min(1000).max(1000000),
  // 단어 길이·개수 한도는 클라(channel-chat.ts)와 동일 상수에서 파생해 드리프트를 막는다.
  forbiddenWords: z
    .array(z.string().trim().min(1).max(CHANNEL_CHAT_FORBIDDEN_WORD_MAX_LENGTH))
    .max(CHANNEL_CHAT_FORBIDDEN_WORD_MAX_COUNT),
  defaultTags: z.array(z.string().trim().min(1).max(12)).max(5),
  defaultTitle: z.string().trim().max(100),
  followerWaitSeconds: followerWaitSecondsSchema,
  linkBlocked: z.boolean(),
  slowModeEnabled: z.boolean(),
  slowModeSeconds: slowModeSecondsSchema,
  ttsEnabled: z.boolean(),
  ttsRate: z.number().min(0.5).max(2),
});

export const getChannelLiveDrawParticipantsSchema = z
  .object({
    broadcastId: z.uuid(),
    drawNoticeId: z.uuid().nullable().optional(),
    endedAt: z.iso.datetime(),
    startedAt: z.iso.datetime(),
  })
  .refine((value) => new Date(value.startedAt).getTime() <= new Date(value.endedAt).getTime());

export const createChannelLivePollSchema = z.object({
  broadcastId: z.uuid(),
  endsAt: z.iso.datetime().nullable().optional(),
  options: z.array(z.string().trim().min(1).max(24)).min(2),
  title: z.string().trim().min(1).max(80),
});

export const endChannelLivePollSchema = z.object({
  pollId: z.uuid(),
});

export const sendChannelLiveInteractionNoticeSchema = z.object({
  broadcastId: z.uuid(),
  content: z.string().trim().min(1).max(300),
  interactionType: z.enum(["poll", "draw"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const sendChannelLiveRouletteNoticeSchema = z.object({
  broadcastId: z.uuid(),
  payload: z.object({
    createdAt: z.iso.datetime().optional(),
    durationSeconds: z.number().positive().max(30).optional(),
    id: z.uuid(),
    items: z.array(z.string().trim().min(1).max(24)).min(2).max(24),
    resultLabel: z.string().trim().min(1).max(24),
    rotationKeyframes: z.array(z.number().finite()).min(1).max(8),
    status: z.enum(["active", "ended"]),
  }),
});

const mediaMtxTrackCodecPropsSchema = z
  .object({
    height: z.number().nullable().optional(),
    width: z.number().nullable().optional(),
  })
  .passthrough();

const mediaMtxTrackSchema = z
  .object({
    codec: z.string(),
    codecProps: mediaMtxTrackCodecPropsSchema.nullable().optional(),
  })
  .passthrough();

export const mediaMtxPathResponseSchema = z
  .object({
    inboundBytes: z.number().nullable().optional(),
    online: z.boolean(),
    onlineTime: z.string().nullable().optional(),
    tracks2: z.array(mediaMtxTrackSchema).nullable().optional(),
  })
  .passthrough();

export type GetChannelLiveDrawParticipantsInput = z.infer<
  typeof getChannelLiveDrawParticipantsSchema
>;
export type CreateChannelLivePollInput = z.infer<typeof createChannelLivePollSchema>;
export type EndChannelLivePollInput = z.infer<typeof endChannelLivePollSchema>;
export type MediaMtxPathResponse = z.infer<typeof mediaMtxPathResponseSchema>;
export type SendChannelLiveInteractionNoticeInput = z.infer<
  typeof sendChannelLiveInteractionNoticeSchema
>;
export type SendChannelLiveRouletteNoticeInput = z.infer<
  typeof sendChannelLiveRouletteNoticeSchema
>;
export type StartLiveBroadcastInput = z.infer<typeof startLiveBroadcastSchema>;
export type UpdateChannelLiveSettingsInput = z.infer<typeof updateChannelLiveSettingsSchema>;
