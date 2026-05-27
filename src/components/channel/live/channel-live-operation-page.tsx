"use client";
// 방송 운영 UI의 설정, 상태, 채팅 패널을 조합합니다.

import ChannelLiveChatPanel from "@/components/channel/live/channel-live-chat-panel";
import ChannelLivePreviewPanel from "@/components/channel/live/channel-live-preview-panel";
import ChannelLiveSettingsPanel from "@/components/channel/live/channel-live-settings-panel";
import ChannelLiveStreamStatusPanel from "@/components/channel/live/channel-live-stream-status-panel";
import { BadgeCheck, Radio } from "lucide-react";
import { useState } from "react";

export type ChannelLiveVisibility = "public" | "private" | "unlisted";

export interface ChannelLiveState {
  isBroadcasting: boolean;
  hasEnded: boolean;
  isChatPaused: boolean;
  visibility: ChannelLiveVisibility;
}

export default function ChannelLiveOperationPage() {
  const [title, setTitle] = useState("오늘은 랭크 위주로 갑니다.");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState(["랭크", "소통", "저지연"]);
  const [visibility, setVisibility] = useState<ChannelLiveVisibility>("public");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [isChatPaused, setIsChatPaused] = useState(false);

  const liveState: ChannelLiveState = {
    isBroadcasting,
    hasEnded,
    isChatPaused,
    visibility,
  };

  const handleStartBroadcast = () => {
    setIsBroadcasting(true);
    setHasEnded(false);
  };

  const handleEndBroadcast = () => {
    setIsBroadcasting(false);
    setHasEnded(true);
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

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border bg-card flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-live/10 text-live inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
            <Radio className="size-3.5" />
            {isBroadcasting ? "방송 중" : hasEnded ? "방송 종료" : "방송 준비"}
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

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <ChannelLivePreviewPanel liveState={liveState} />
          <ChannelLiveSettingsPanel
            title={title}
            tagInput={tagInput}
            tags={tags}
            visibility={visibility}
            liveState={liveState}
            onTitleChange={setTitle}
            onTagInputChange={setTagInput}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onVisibilityChange={setVisibility}
            onStartBroadcast={handleStartBroadcast}
            onEndBroadcast={handleEndBroadcast}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <ChannelLiveStreamStatusPanel liveState={liveState} />
          <ChannelLiveChatPanel
            liveState={liveState}
            onToggleChatPaused={() => setIsChatPaused((currentValue) => !currentValue)}
          />
        </div>
      </div>
    </div>
  );
}
