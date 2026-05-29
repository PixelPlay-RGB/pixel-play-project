"use client";
// 방송 제목, 태그, 공개 상태와 시작·종료 버튼을 제공하는 설정 패널입니다.

import type {
  ChannelLiveState,
  ChannelLiveVisibility,
} from "@/components/channel/live/channel-live-operation-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CircleStop, MessageSquareText, Play, Radio, Save, Tag, X } from "lucide-react";

interface Props {
  broadcastActionError: string | null;
  chatRuleText: string;
  isBroadcastActionPending: boolean;
  isSettingsActionPending: boolean;
  settingsActionMessage: string | null;
  title: string;
  tagInput: string;
  tags: string[];
  visibility: ChannelLiveVisibility;
  liveState: ChannelLiveState;
  onChatRuleTextChange: (chatRuleText: string) => void;
  onTitleChange: (title: string) => void;
  onTagInputChange: (tag: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onSaveSettings: () => void;
  onVisibilityChange: (visibility: ChannelLiveVisibility) => void;
  onStartBroadcast: () => void;
  onEndBroadcast: () => void;
}

const VISIBILITY_OPTIONS: Array<{
  value: ChannelLiveVisibility;
  label: string;
}> = [
  { value: "public", label: "공개" },
  { value: "private", label: "비공개" },
  { value: "unlisted", label: "일부 공개" },
];

export default function ChannelLiveSettingsPanel({
  broadcastActionError,
  chatRuleText,
  isBroadcastActionPending,
  isSettingsActionPending,
  settingsActionMessage,
  title,
  tagInput,
  tags,
  visibility,
  liveState,
  onChatRuleTextChange,
  onTitleChange,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onSaveSettings,
  onVisibilityChange,
  onStartBroadcast,
  onEndBroadcast,
}: Props) {
  return (
    <Card className="relative">
      <CardHeader className="pr-20">
        <CardTitle>방송 시작 설정</CardTitle>
      </CardHeader>
      <span className="bg-brand/10 text-brand absolute top-4 right-4 inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold">
        저장됨
      </span>
      <CardContent className="flex flex-col gap-4">
        {broadcastActionError && (
          <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-xs font-semibold">
            {broadcastActionError}
          </div>
        )}

        {settingsActionMessage && (
          <div
            className={cn(
              "rounded-lg border px-3 py-2 text-xs font-semibold",
              settingsActionMessage.includes("못했습니다")
                ? "border-destructive/20 bg-destructive/10 text-destructive"
                : "border-brand/20 bg-brand/10 text-brand",
            )}
          >
            {settingsActionMessage}
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="channel-live-title">방송 제목</Label>
          <Input
            id="channel-live-title"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="방송 제목을 입력하세요"
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="channel-live-tag">방송 태그</Label>
            <span className="text-muted-foreground text-xs">{tagInput.length} / 12</span>
          </div>
          <div className="flex gap-2">
            <Input
              id="channel-live-tag"
              value={tagInput}
              maxLength={12}
              onChange={(event) => onTagInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onAddTag();
                }
              }}
              placeholder="태그를 입력해주세요"
            />
            <Button
              type="button"
              className="bg-brand hover:bg-brand/90 text-white"
              onClick={onAddTag}
            >
              <Tag className="size-4" />
              추가
            </Button>
          </div>
          <div className="border-border flex min-h-12 flex-wrap items-center gap-2 rounded-lg border p-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="bg-live/10 text-live inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                onClick={() => onRemoveTag(tag)}
              >
                #{tag}
                <X className="size-3" />
              </button>
            ))}
          </div>
          <span className="text-muted-foreground text-xs">
            최대 5개까지 검색과 추천에 사용됩니다.
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border-border rounded-lg border p-3">
            <span className="text-sm font-semibold">공개 상태</span>
            <div className="bg-muted mt-3 grid grid-cols-3 rounded-lg p-1">
              {VISIBILITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "h-8 rounded-md text-xs font-semibold transition-colors",
                    visibility === option.value
                      ? "bg-background text-brand shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-pressed={visibility === option.value}
                  onClick={() => onVisibilityChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-border rounded-lg border p-3">
            <span className="text-sm font-semibold">송출 상태</span>
            <div className="mt-3 flex items-center gap-3">
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full",
                  liveState.isBroadcasting
                    ? "bg-live/10 text-live"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Radio className="size-4" />
              </span>
              <div className="flex flex-col gap-1">
                <strong className="text-sm">
                  {liveState.isBroadcasting ? "송출 중" : "대기 중"}
                </strong>
                <span className="text-muted-foreground text-xs">
                  {liveState.isBroadcasting
                    ? "목업 상태에서 방송 중으로 표시합니다."
                    : "방송 시작 후 연결 상태를 확인합니다."}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border-border rounded-lg border p-3">
            <span className="text-sm font-semibold">채팅 규칙</span>
            <div className="mt-3 flex items-start gap-3">
              <MessageSquareText className="text-brand mt-0.5 size-4 shrink-0" />
              <div className="flex flex-col gap-1">
                <strong className="text-sm">
                  {chatRuleText.trim() ? "안내문 작성됨" : "안내문 미작성"}
                </strong>
                <span className="text-muted-foreground text-xs">
                  채팅창 상단에 운영 안내를 고정합니다.
                </span>
              </div>
            </div>
          </div>

          <div className="border-border rounded-lg border p-3">
            <Label htmlFor="channel-live-chat-rule">채팅 규칙 문구</Label>
            <Textarea
              id="channel-live-chat-rule"
              className="mt-3 min-h-20"
              value={chatRuleText}
              maxLength={500}
              onChange={(event) => onChatRuleTextChange(event.target.value)}
              placeholder="채팅창에 고정할 운영 안내를 입력해주세요."
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onSaveSettings}
            disabled={isSettingsActionPending}
          >
            <Save className="size-4" />
            설정 저장
          </Button>
          {liveState.isBroadcasting ? (
            <Button
              type="button"
              variant="destructive"
              onClick={onEndBroadcast}
              disabled={isBroadcastActionPending}
            >
              <CircleStop className="size-4" />
              방송 종료
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-live hover:bg-live/90 text-white"
              onClick={onStartBroadcast}
              disabled={isBroadcastActionPending}
            >
              <Play className="size-4" />
              방송 시작
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
