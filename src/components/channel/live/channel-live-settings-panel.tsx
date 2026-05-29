"use client";
// 방송 제목, 태그, 미리보기와 채팅 설정을 제공하는 설정 패널입니다.

import type {
  ChannelLiveChatScope,
  ChannelLiveState,
} from "@/components/channel/live/channel-live-operation-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  CircleStop,
  HandCoins,
  ImageIcon,
  Play,
  Save,
  ShieldAlert,
  Tag,
  Timer,
  Upload,
  Users,
  X,
} from "lucide-react";
import { type ChangeEvent, type ComponentType, type DragEvent, useRef } from "react";

interface Props {
  broadcastActionError: string | null;
  chatScope: ChannelLiveChatScope;
  isAdultOnly: boolean;
  isBroadcastActionPending: boolean;
  isDonationEnabled: boolean;
  isSlowModeEnabled: boolean;
  isSettingsActionPending: boolean;
  settingsActionMessage: string | null;
  thumbnailPreviewName: string;
  thumbnailPreviewUrl: string;
  title: string;
  tagInput: string;
  tags: string[];
  liveState: ChannelLiveState;
  onAdultOnlyChange: (isAdultOnly: boolean) => void;
  onChatScopeChange: (chatScope: ChannelLiveChatScope) => void;
  onDonationEnabledChange: (isDonationEnabled: boolean) => void;
  onSlowModeEnabledChange: (isSlowModeEnabled: boolean) => void;
  onThumbnailFileChange: (file: File) => void;
  onThumbnailRemove: () => void;
  onTitleChange: (title: string) => void;
  onTagInputChange: (tag: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onSaveSettings: () => void;
  onStartBroadcast: () => void;
  onEndBroadcast: () => void;
}

const CHAT_SCOPE_OPTIONS: Array<{
  label: string;
  value: ChannelLiveChatScope;
}> = [
  { label: "모든 사람", value: "all" },
  { label: "팔로워 전용", value: "followers" },
  { label: "운영자 전용", value: "moderators" },
];

interface SettingToggleButtonProps {
  checked: boolean;
  description: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onChange: (checked: boolean) => void;
}

function SettingToggleButton({
  checked,
  description,
  icon: Icon,
  label,
  onChange,
}: SettingToggleButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "border-border flex min-h-24 items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
        checked ? "border-brand/40 bg-brand/10" : "hover:bg-muted/50",
      )}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="flex min-w-0 gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            checked ? "bg-brand text-white" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <strong className="text-sm">{label}</strong>
          <span className="text-muted-foreground text-xs">{description}</span>
        </span>
      </span>
      <span
        className={cn(
          "mt-1 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
          checked ? "bg-brand" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "bg-background size-4 rounded-full transition-transform",
            checked && "translate-x-4",
          )}
        />
      </span>
    </button>
  );
}

export default function ChannelLiveSettingsPanel({
  broadcastActionError,
  chatScope,
  isAdultOnly,
  isBroadcastActionPending,
  isDonationEnabled,
  isSlowModeEnabled,
  isSettingsActionPending,
  settingsActionMessage,
  thumbnailPreviewName,
  thumbnailPreviewUrl,
  title,
  tagInput,
  tags,
  liveState,
  onAdultOnlyChange,
  onChatScopeChange,
  onDonationEnabledChange,
  onSlowModeEnabledChange,
  onThumbnailFileChange,
  onThumbnailRemove,
  onTitleChange,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onSaveSettings,
  onStartBroadcast,
  onEndBroadcast,
}: Props) {
  const trimmedThumbnailPreviewUrl = thumbnailPreviewUrl.trim();
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const handleThumbnailInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    onThumbnailFileChange(file);
    event.target.value = "";
  };

  const handleThumbnailDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];

    if (!file) return;

    onThumbnailFileChange(file);
  };

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
        </div>

        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border-border rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="text-brand size-4" />
                <span className="text-sm font-semibold">미리보기 이미지</span>
              </div>
              <input
                ref={thumbnailInputRef}
                className="sr-only"
                id="channel-live-thumbnail"
                type="file"
                accept="image/*"
                onChange={handleThumbnailInputChange}
              />
              <div
                className={cn(
                  "border-border bg-muted mt-3 flex aspect-video flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed bg-cover bg-center p-3 text-center",
                  trimmedThumbnailPreviewUrl && "border-solid",
                )}
                role="button"
                tabIndex={0}
                style={
                  trimmedThumbnailPreviewUrl
                    ? { backgroundImage: `url(${trimmedThumbnailPreviewUrl})` }
                    : undefined
                }
                onClick={() => thumbnailInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleThumbnailDrop}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    thumbnailInputRef.current?.click();
                  }
                }}
              >
                {!trimmedThumbnailPreviewUrl && (
                  <div className="text-muted-foreground flex flex-col items-center gap-2 text-xs">
                    <Upload className="size-6" />
                    <span>이미지를 끌어오거나 추가하세요.</span>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-muted-foreground min-w-0 truncate text-xs">
                  {thumbnailPreviewName || "이미지 없음"}
                </span>
                {trimmedThumbnailPreviewUrl ? (
                  <Button type="button" size="sm" variant="outline" onClick={onThumbnailRemove}>
                    삭제
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    추가
                  </Button>
                )}
              </div>
            </div>

            <div className="border-border rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Users className="text-brand size-4" />
                <span className="text-sm font-semibold">채팅 설정</span>
              </div>
              <div className="bg-muted mt-3 grid grid-cols-3 gap-1 rounded-lg p-1">
                {CHAT_SCOPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      "h-9 rounded-md px-1 text-xs font-semibold transition-colors",
                      chatScope === option.value
                        ? "bg-background text-brand shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-pressed={chatScope === option.value}
                    onClick={() => onChatScopeChange(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={cn(
                  "border-border mt-3 flex min-h-16 w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
                  isSlowModeEnabled ? "border-brand/40 bg-brand/10" : "hover:bg-muted/50",
                )}
                aria-pressed={isSlowModeEnabled}
                onClick={() => onSlowModeEnabledChange(!isSlowModeEnabled)}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      isSlowModeEnabled ? "bg-brand text-white" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Timer className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <strong className="text-sm">저속모드</strong>
                    <span className="text-muted-foreground text-xs">
                      채팅 입력 간격을 제한합니다.
                    </span>
                  </span>
                </span>
                <span
                  className={cn(
                    "flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
                    isSlowModeEnabled ? "bg-brand" : "bg-muted-foreground/30",
                  )}
                >
                  <span
                    className={cn(
                      "bg-background size-4 rounded-full transition-transform",
                      isSlowModeEnabled && "translate-x-4",
                    )}
                  />
                </span>
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SettingToggleButton
              checked={isAdultOnly}
              description="19세 이상 연령 제한을 적용합니다."
              icon={ShieldAlert}
              label="성인 방송 설정"
              onChange={onAdultOnlyChange}
            />
            <SettingToggleButton
              checked={isDonationEnabled}
              description="시청자 후원을 받을 수 있게 설정합니다."
              icon={HandCoins}
              label="후원 설정"
              onChange={onDonationEnabledChange}
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
