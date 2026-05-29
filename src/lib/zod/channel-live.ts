// 방송 운영 입력값 검증 스키마를 정의합니다.

import { z } from "zod";

export const startLiveBroadcastSchema = z.object({
  tags: z.array(z.string().trim().min(1).max(12)).max(5),
  thumbnailUrl: z.string().url().nullable().optional(),
  title: z.string().trim().min(1).max(100),
});

export const updateChannelLiveSettingsSchema = z.object({
  chatRuleText: z.string().max(500),
  defaultTags: z.array(z.string().trim().min(1).max(12)).max(5),
  defaultTitle: z.string().trim().min(1).max(100),
});

export type StartLiveBroadcastInput = z.infer<typeof startLiveBroadcastSchema>;
export type UpdateChannelLiveSettingsInput = z.infer<typeof updateChannelLiveSettingsSchema>;
