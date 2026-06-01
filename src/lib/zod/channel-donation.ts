// 채널 후원 설정 입력값을 검증합니다.

import {
  DONATION_ALERT_DURATION_OPTIONS,
  DONATION_ALERT_VOLUME_MAX,
  DONATION_ALERT_VOLUME_MIN,
  DONATION_MIN_AMOUNT_CEILING,
  DONATION_MIN_AMOUNT_FLOOR,
  DONATION_TTS_RATE_OPTIONS,
} from "@/constants/channel/donation";
import { FORM_MESSAGE } from "@/constants/common/form-message";
import { z } from "zod";

const durationValueSet = new Set<number>(
  DONATION_ALERT_DURATION_OPTIONS.map((option) => option.value),
);
const ttsRateValueSet = new Set<number>(DONATION_TTS_RATE_OPTIONS.map((option) => option.value));

const minAmountMessage = FORM_MESSAGE.channelDonation.minAmountRange(
  DONATION_MIN_AMOUNT_FLOOR,
  DONATION_MIN_AMOUNT_CEILING,
);

export const channelDonationSettingsSchema = z.object({
  donationEnabled: z.boolean(),
  donationMinAmount: z
    .number()
    .int()
    .min(DONATION_MIN_AMOUNT_FLOOR, { error: minAmountMessage })
    .max(DONATION_MIN_AMOUNT_CEILING, { error: minAmountMessage }),
  donationAmountVisible: z.boolean(),
  donationAlertEnabled: z.boolean(),
  donationAlertDurationSeconds: z
    .number()
    .int()
    .refine((value) => durationValueSet.has(value), {
      error: FORM_MESSAGE.channelDonation.alertDurationInvalid,
    }),
  alertSoundEnabled: z.boolean(),
  alertVolume: z
    .number()
    .int()
    .min(DONATION_ALERT_VOLUME_MIN, { error: FORM_MESSAGE.channelDonation.alertVolumeRange })
    .max(DONATION_ALERT_VOLUME_MAX, { error: FORM_MESSAGE.channelDonation.alertVolumeRange }),
  ttsEnabled: z.boolean(),
  ttsRate: z.number().refine((value) => ttsRateValueSet.has(value), {
    error: FORM_MESSAGE.channelDonation.ttsRateInvalid,
  }),
});

export type ChannelDonationSettingsInput = z.infer<typeof channelDonationSettingsSchema>;
