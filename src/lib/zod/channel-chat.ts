// 채널 채팅 설정 입력값을 검증합니다.

import {
  CHANNEL_CHAT_FOLLOWER_WAIT_OPTIONS,
  CHANNEL_CHAT_FORBIDDEN_WORD_MAX_COUNT,
  CHANNEL_CHAT_FORBIDDEN_WORD_MAX_LENGTH,
  CHANNEL_CHAT_RULE_MAX_LENGTH,
  CHANNEL_CHAT_SLOW_MODE_OPTIONS,
} from "@/constants/channel/chat";
import { FORM_MESSAGE } from "@/constants/common/form-message";
import { z } from "zod";

const followerWaitValueSet = new Set<number>(
  CHANNEL_CHAT_FOLLOWER_WAIT_OPTIONS.map((option) => option.value),
);
const slowModeValueSet = new Set<number>(
  CHANNEL_CHAT_SLOW_MODE_OPTIONS.map((option) => option.value),
);

export const channelChatSettingsSchema = z.object({
  chatScope: z.enum(["authenticated", "follower", "manager"], {
    error: FORM_MESSAGE.channelChat.chatScopeRequired,
  }),
  followerWaitSeconds: z
    .number()
    .int()
    .refine((value) => followerWaitValueSet.has(value), {
      error: FORM_MESSAGE.channelChat.followerWaitInvalid,
    }),
  slowModeEnabled: z.boolean(),
  slowModeSeconds: z
    .number()
    .int()
    .refine((value) => slowModeValueSet.has(value), {
      error: FORM_MESSAGE.channelChat.slowModeSecondsInvalid,
    }),
  linkBlocked: z.boolean(),
  forbiddenWords: z
    .array(
      z
        .string()
        .trim()
        .min(1, { error: FORM_MESSAGE.channelChat.forbiddenWordRequired })
        .max(CHANNEL_CHAT_FORBIDDEN_WORD_MAX_LENGTH, {
          error: FORM_MESSAGE.channelChat.forbiddenWordMax(CHANNEL_CHAT_FORBIDDEN_WORD_MAX_LENGTH),
        }),
    )
    .max(CHANNEL_CHAT_FORBIDDEN_WORD_MAX_COUNT, {
      error: FORM_MESSAGE.channelChat.forbiddenWordsMax(CHANNEL_CHAT_FORBIDDEN_WORD_MAX_COUNT),
    }),
  chatRuleText: z.string().max(CHANNEL_CHAT_RULE_MAX_LENGTH, {
    error: FORM_MESSAGE.channelChat.chatRuleTextMax(CHANNEL_CHAT_RULE_MAX_LENGTH),
  }),
  chatDonationMessageEnabled: z.boolean(),
});

export type ChannelChatSettingsInput = z.infer<typeof channelChatSettingsSchema>;
