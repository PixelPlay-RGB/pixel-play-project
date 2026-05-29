"use client";
// 방송 운영 UI의 설정, 상태, 채팅 패널을 조합합니다.

import {
  endLiveBroadcastAction,
  startLiveBroadcastAction,
  type ChannelLiveStudioSnapshot,
  updateChannelLiveSettingsAction,
} from "@/actions/channel/live";
import ChannelLiveChatPanel from "@/components/channel/live/channel-live-chat-panel";
import ChannelLivePreviewPanel from "@/components/channel/live/channel-live-preview-panel";
import ChannelLiveSettingsPanel from "@/components/channel/live/channel-live-settings-panel";
import ChannelLiveStreamStatusPanel from "@/components/channel/live/channel-live-stream-status-panel";
import { CHANNEL_LIVE_MEDIA_CONFIG } from "@/constants/channel/channel-live-media";
import { cn } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";
import { useState, useTransition } from "react";

export type ChannelLiveVisibility = "public" | "private" | "unlisted";

export interface ChannelLiveState {
  isBroadcasting: boolean;
  hasEnded: boolean;
  isChatPaused: boolean;
  visibility: ChannelLiveVisibility;
}

interface Props {
  initialSnapshot?: ChannelLiveStudioSnapshot;
}

const DEFAULT_TITLE = "";
const DEFAULT_TAGS: string[] = [];

function getBroadcastStatusLabel(liveState: ChannelLiveState) {
  if (liveState.isBroadcasting) return "방송 중";
  if (liveState.hasEnded) return "방송 종료";

  return "방송 준비";
}

function getBroadcastStatusClassName(liveState: ChannelLiveState) {
  if (liveState.isBroadcasting) {
    return "bg-destructive/10 text-destructive";
  }

  if (liveState.hasEnded) {
    return "bg-muted text-muted-foreground";
  }

  return "bg-warning/10 text-warning";
}

export default function ChannelLiveOperationPage({ initialSnapshot }: Props) {
  const activeBroadcast = initialSnapshot?.activeBroadcast ?? null;
  const initialSettings = initialSnapshot?.settings;
  const [title, setTitle] = useState(
    activeBroadcast?.title || initialSettings?.defaultTitle || DEFAULT_TITLE,
  );
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState(
    activeBroadcast?.tags.length
      ? activeBroadcast.tags
      : initialSettings?.defaultTags.length
        ? initialSettings.defaultTags
        : DEFAULT_TAGS,
  );
  const visibility: ChannelLiveVisibility = "public";
  const [isBroadcasting, setIsBroadcasting] = useState(Boolean(activeBroadcast));
  const [hasEnded, setHasEnded] = useState(false);
  const [isChatPaused, setIsChatPaused] = useState(false);
  const [broadcastId, setBroadcastId] = useState<string | null>(activeBroadcast?.id ?? null);
  const [broadcastStartedAt, setBroadcastStartedAt] = useState<string | null>(
    activeBroadcast?.startedAt ?? null,
  );
  const [broadcastActionError, setBroadcastActionError] = useState<string | null>(null);
  const [settingsActionMessage, setSettingsActionMessage] = useState<string | null>(null);
  const [chatRuleText, setChatRuleText] = useState(initialSettings?.chatRuleText ?? "");
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState(
    activeBroadcast?.thumbnailUrl ?? "",
  );
  const [isAdultOnly, setIsAdultOnly] = useState(false);
  const [isDonationEnabled, setIsDonationEnabled] = useState(false);
  const [isBroadcastActionPending, startBroadcastTransition] = useTransition();
  const [isSettingsActionPending, startSettingsTransition] = useTransition();

  const liveState: ChannelLiveState = {
    isBroadcasting,
    hasEnded,
    isChatPaused,
    visibility,
  };

  const handleStartBroadcast = () => {
    setBroadcastActionError(null);
    startBroadcastTransition(async () => {
      const result = await startLiveBroadcastAction({
        tags,
        thumbnailUrl: thumbnailPreviewUrl.trim() || null,
        title,
      });

      if (!result.success || !result.data?.broadcastId) {
        setBroadcastActionError("방송 시작 정보를 저장하지 못했습니다.");
        return;
      }

      setBroadcastId(result.data.broadcastId);
      setBroadcastStartedAt(new Date().toISOString());
      setIsBroadcasting(true);
      setHasEnded(false);
    });
  };

  const handleEndBroadcast = () => {
    setBroadcastActionError(null);
    startBroadcastTransition(async () => {
      if (broadcastId) {
        const result = await endLiveBroadcastAction({ broadcastId });

        if (!result.success) {
          setBroadcastActionError("방송 종료 정보를 저장하지 못했습니다.");
          return;
        }
      }

      setBroadcastId(null);
      setBroadcastStartedAt(null);
      setIsBroadcasting(false);
      setHasEnded(true);
    });
  };

  const handleAddTag = () => {
    const nextTag = tagInput.trim();

    if (!nextTag || tags.includes(nextTag) || tags.length >= 5) return;

    setTags((currentTags) => [...currentTags, nextTag]);
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setTags((currentTags) => currentTags.filter((currentTag) => currentTag !== tag));
  };

  const handleSaveSettings = () => {
    setSettingsActionMessage(null);
    startSettingsTransition(async () => {
      const result = await updateChannelLiveSettingsAction({
        chatRuleText,
        defaultTags: tags,
        defaultTitle: title,
      });

      if (!result.success || !result.data) {
        setSettingsActionMessage("방송 설정을 저장하지 못했습니다.");
        return;
      }

      setChatRuleText(result.data.settings.chatRuleText);
      setSettingsActionMessage("방송 설정을 저장했습니다.");
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <div className="border-border bg-card flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold",
                  getBroadcastStatusClassName(liveState),
                )}
              >
                <span className="relative flex size-2.5">
                  {liveState.isBroadcasting && (
                    <span className="bg-destructive absolute inline-flex size-full animate-ping rounded-full opacity-75" />
                  )}
                  <span
                    className={cn(
                      "relative inline-flex size-2.5 rounded-full",
                      liveState.isBroadcasting
                        ? "bg-destructive"
                        : liveState.hasEnded
                          ? "bg-muted-foreground"
                          : "bg-warning",
                    )}
                  />
                </span>
                {getBroadcastStatusLabel(liveState)}
              </span>
              <span className="text-foreground text-sm font-semibold">
                {isBroadcasting ? "송출 중" : "송출 대기"}
              </span>
            </div>
            <span className="bg-brand/10 text-brand inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
              <BadgeCheck className="size-3.5" />
              {visibility === "public"
                ? "공개 예정"
                : visibility === "private"
                  ? "비공개"
                  : "일부 공개"}
            </span>
          </div>
          <ChannelLivePreviewPanel liveState={liveState} title={title} />
          <ChannelLiveSettingsPanel
            broadcastActionError={broadcastActionError}
            isAdultOnly={isAdultOnly}
            isBroadcastActionPending={isBroadcastActionPending}
            isDonationEnabled={isDonationEnabled}
            isSettingsActionPending={isSettingsActionPending}
            settingsActionMessage={settingsActionMessage}
            thumbnailPreviewUrl={thumbnailPreviewUrl}
            title={title}
            tagInput={tagInput}
            tags={tags}
            liveState={liveState}
            onAdultOnlyChange={setIsAdultOnly}
            onDonationEnabledChange={setIsDonationEnabled}
            onThumbnailPreviewUrlChange={setThumbnailPreviewUrl}
            onTitleChange={setTitle}
            onTagInputChange={setTagInput}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onSaveSettings={handleSaveSettings}
            onStartBroadcast={handleStartBroadcast}
            onEndBroadcast={handleEndBroadcast}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:h-full">
          <ChannelLiveStreamStatusPanel
            activeBroadcastStartedAt={broadcastStartedAt}
            liveState={liveState}
            streamPath={CHANNEL_LIVE_MEDIA_CONFIG.streamPath}
          />
          <ChannelLiveChatPanel
            liveState={liveState}
            onToggleChatPaused={() => setIsChatPaused((currentValue) => !currentValue)}
          />
        </div>
      </div>
    </div>
  );
}
