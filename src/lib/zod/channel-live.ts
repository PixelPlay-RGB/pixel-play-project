// 방송 운영 입력값 검증 스키마를 정의합니다.

import { z } from "zod";

import { messageContentSchema } from "@/lib/zod/message";

const FOLLOWER_WAIT_SECONDS = [
  0, 300, 600, 1800, 3600, 86400, 604800, 2592000, 5184000, 7776000, 10368000, 12960000, 15552000,
];
const SLOW_MODE_SECONDS = [3, 5, 10, 30, 60, 120, 300];

const followerWaitSecondsSchema = z
  .number()
  .int()
  .refine((value) => FOLLOWER_WAIT_SECONDS.includes(value));

const slowModeSecondsSchema = z
  .number()
  .int()
  .refine((value) => SLOW_MODE_SECONDS.includes(value));

export const startLiveBroadcastSchema = z.object({
  tags: z.array(z.string().trim().min(1).max(12)).max(5),
  thumbnailUrl: z.string().url().nullable().optional(),
  title: z.string().trim().min(1).max(100),
});

export const updateChannelLiveSettingsSchema = z.object({
  alertSoundEnabled: z.boolean(),
  alertVolume: z.number().int().min(0).max(100),
  chatDonationMessageEnabled: z.boolean(),
  chatRuleText: z.string().max(300),
  chatScope: z.enum(["authenticated", "follower", "manager"]),
  donationAlertDurationSeconds: z.number().int().min(3).max(30),
  donationAmountVisible: z.boolean(),
  donationEnabled: z.boolean(),
  donationMinAmount: z.number().int().min(1000).max(1000000),
  forbiddenWords: z.array(z.string().trim().min(1).max(30)).max(100),
  defaultTags: z.array(z.string().trim().min(1).max(12)).max(5),
  defaultTitle: z.string().trim().max(100),
  followerWaitSeconds: followerWaitSecondsSchema,
  linkBlocked: z.boolean(),
  slowModeEnabled: z.boolean(),
  slowModeSeconds: slowModeSecondsSchema,
  ttsEnabled: z.boolean(),
  ttsRate: z.number().min(0.5).max(2),
});

export const sendChannelLiveChatMessageSchema = z.object({
  broadcastId: z.string().uuid(),
  content: messageContentSchema,
});

export const getChannelLiveDrawParticipantsSchema = z
  .object({
    broadcastId: z.string().uuid(),
    endedAt: z.string().datetime(),
    startedAt: z.string().datetime(),
  })
  .refine((value) => new Date(value.startedAt).getTime() <= new Date(value.endedAt).getTime());

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
export type MediaMtxPathResponse = z.infer<typeof mediaMtxPathResponseSchema>;
export type SendChannelLiveChatMessageInput = z.infer<typeof sendChannelLiveChatMessageSchema>;
export type StartLiveBroadcastInput = z.infer<typeof startLiveBroadcastSchema>;
export type UpdateChannelLiveSettingsInput = z.infer<typeof updateChannelLiveSettingsSchema>;
