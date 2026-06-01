// 채널 보안 설정 화면에서 사용하는 타입을 정의합니다.
import type { LucideIcon } from "lucide-react";

import type { GenericTables } from "@/types/common/supabase.types";

export type ChannelSecurityTokenKind = "stream_key" | "chat_overlay" | "donation_alert";
export type ChannelSecurityUrlKind = Extract<
  ChannelSecurityTokenKind,
  "chat_overlay" | "donation_alert"
>;

type CreatorStudioSetting = GenericTables<"creator_studio_setting">;

export interface ChannelSecuritySnapshot {
  creatorId: string;
  streamServerUrl: string;
  streamKey: string;
  chatOverlayUrl: string;
  donationAlertUrl: string;
  streamKeyVersion: number;
  chatOverlayVersion: number;
  donationAlertVersion: number;
}

export interface ChannelSecurityVersionResult {
  tokenKind: ChannelSecurityTokenKind;
  version: number;
  snapshot: ChannelSecuritySnapshot;
}

export interface CreatorStudioSnapshotSettings {
  streamKeyVersion?: CreatorStudioSetting["stream_key_version"];
  chatOverlayVersion?: CreatorStudioSetting["chat_overlay_version"];
  donationAlertVersion?: CreatorStudioSetting["donation_alert_version"];
}

export interface ChannelSecurityUrlPopupSize {
  width: number;
  height: number;
}

export interface ChannelSecurityUrlCardMeta {
  tokenKind: ChannelSecurityUrlKind;
  title: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: "brand" | "live";
  popup: ChannelSecurityUrlPopupSize;
  tutorialItems: string[];
}
