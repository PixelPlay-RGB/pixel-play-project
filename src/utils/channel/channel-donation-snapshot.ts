// 채널 후원 설정 snapshot의 화면 표시값을 조립합니다.
import "server-only";

import { DONATION_MIN_AMOUNT_FLOOR } from "@/constants/channel/donation";
import type {
  ChannelDonationSnapshot,
  RecentDonationItem,
} from "@/types/channel/donation";
import type { Json } from "@/types/database.types";

type JsonObject = Record<string, Json | undefined>;

export function buildChannelDonationSnapshot(
  creatorId: string,
  snapshot: Json,
): ChannelDonationSnapshot {
  const root = readObject(snapshot);
  const settings = readObject(root?.settings);
  const monthly = readObject(root?.monthlyDonation);
  const settlement = readObject(settings?.settlementDemo);

  return {
    creatorId,
    settings: {
      donationEnabled: readBoolean(settings?.donationEnabled, true),
      donationMinAmount: readNumber(settings?.donationMinAmount, DONATION_MIN_AMOUNT_FLOOR),
      donationAmountVisible: readBoolean(settings?.donationAmountVisible, true),
      donationAlertEnabled: readBoolean(settings?.donationAlertEnabled, true),
      donationAlertDurationSeconds: readNumber(settings?.donationAlertDurationSeconds, 5),
      alertSoundEnabled: readBoolean(settings?.alertSoundEnabled, true),
      alertVolume: readNumber(settings?.alertVolume, 32),
      ttsEnabled: readBoolean(settings?.ttsEnabled, true),
      ttsRate: readNumber(settings?.ttsRate, 1),
    },
    settlement: {
      status: readString(settlement?.status, "ready"),
      totalAmount: readNumber(settlement?.totalAmount, 0),
      bankName: readString(settlement?.bankName, ""),
      accountHolder: readString(settlement?.accountHolder, ""),
    },
    monthlyDonation: {
      amountTotal: readNumber(monthly?.amountTotal, 0),
      donationCount: readNumber(monthly?.donationCount, 0),
    },
    recentDonations: readRecentDonations(root?.recentDonations),
  };
}

function readRecentDonations(value: Json | undefined): RecentDonationItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((raw) => {
    const item = readObject(raw);

    if (!item || typeof item.id !== "string") {
      return [];
    }

    return [
      {
        id: item.id,
        donorNickname: readString(item.donorNickname, "익명"),
        amount: readNumber(item.amount, 0),
        message: readString(item.message, ""),
        createdAt: readString(item.createdAt, ""),
      },
    ];
  });
}

function readNumber(value: Json | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readBoolean(value: Json | undefined, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function readString(value: Json | undefined, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function readObject(value: Json | undefined): JsonObject | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as JsonObject;
}
