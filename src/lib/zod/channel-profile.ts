// 채널 관리(소개·배너) 입력값을 검증합니다.

import { FORM_MESSAGE } from "@/constants/common/form-message";
import { z } from "zod";

export const CHANNEL_BIO_MAX = 500;
export const CHANNEL_BANNER_MAX = 5;
export const CHANNEL_BANNER_TITLE_MAX = 20;
export const CHANNEL_BANNER_LINK_MAX = 100;

// http(s) URL 검증 정규식. 배너 링크 클라 검증에서도 동일 규칙을 재사용한다.
export const HTTP_URL_PATTERN = /^https?:\/\/.+/;

const httpUrlField = (max: number, invalidMessage: string, maxMessage: string) =>
  z
    .string()
    .trim()
    .min(1, { error: invalidMessage })
    .max(max, { error: maxMessage })
    .refine((value) => HTTP_URL_PATTERN.test(value), { error: invalidMessage });

export const channelProfileSettingsSchema = z.object({
  bio: z
    .string()
    .max(CHANNEL_BIO_MAX, { error: FORM_MESSAGE.channelProfile.bioMax(CHANNEL_BIO_MAX) }),
});

export type ChannelProfileSettingsInput = z.infer<typeof channelProfileSettingsSchema>;

export const channelBannerInputSchema = z.object({
  title: z
    .string()
    .trim()
    .max(CHANNEL_BANNER_TITLE_MAX, {
      error: FORM_MESSAGE.channelProfile.bannerTitleMax(CHANNEL_BANNER_TITLE_MAX),
    }),
  linkUrl: httpUrlField(
    CHANNEL_BANNER_LINK_MAX,
    FORM_MESSAGE.channelProfile.bannerLinkInvalid,
    FORM_MESSAGE.channelProfile.bannerLinkMax(CHANNEL_BANNER_LINK_MAX),
  ),
});

export type ChannelBannerInput = z.infer<typeof channelBannerInputSchema>;
