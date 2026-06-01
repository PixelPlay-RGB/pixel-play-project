"use client";
// 방송 제목, 태그, 미리보기와 채팅 설정을 제공하는 설정 패널입니다.

import type { ChannelLiveState } from "@/components/channel/live/channel-live-operation-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Bell,
  CircleStop,
  HandCoins,
  ImageIcon,
  Link2,
  Mic2,
  Play,
  Save,
  Tag,
  Timer,
  Upload,
  Users,
  Volume2,
  X,
} from "lucide-react";
import { type ChangeEvent, type ComponentType, type DragEvent, useRef } from "react";

interface Props {
  broadcastActionError: string | null;
  isAlertSoundEnabled: boolean;
  isBroadcastActionPending: boolean;
  isDonationAlertEnabled: boolean;
  isDonationAmountVisible: boolean;
  isDonationEnabled: boolean;
  isLinkBlocked: boolean;
  isSlowModeEnabled: boolean;
  isSettingsActionPending: boolean;
  isTtsEnabled: boolean;
  settingsActionMessage: string | null;
  thumbnailPreviewName: string;
  thumbnailPreviewUrl: string;
  title: string;
  tagInput: string;
  tags: string[];
  liveState: ChannelLiveState;
  onAlertSoundEnabledChange: (isAlertSoundEnabled: boolean) => void;
  onDonationAlertEnabledChange: (isDonationAlertEnabled: boolean) => void;
  onDonationAmountVisibleChange: (isDonationAmountVisible: boolean) => void;
  onDonationEnabledChange: (isDonationEnabled: boolean) => void;
  onLinkBlockedChange: (isLinkBlocked: boolean) => void;
  onSlowModeEnabledChange: (isSlowModeEnabled: boolean) => void;
  onThumbnailFileChange: (file: File) => void;
  onThumbnailRemove: () => void;
  onTitleChange: (title: string) => void;
  onTtsEnabledChange: (isTtsEnabled: boolean) => void;
  onTagInputChange: (tag: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onSaveSettings: () => void;
  onStartBroadcast: () => void;
  onEndBroadcast: () => void;
}

interface SettingToggleButtonProps {
  checked: boolean;
  className?: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onChange: (checked: boolean) => void;
}

function SettingToggleButton({
  checked,
  className,
  description,
  icon: Icon,
  label,
  onChange,
}: SettingToggleButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "border-border flex min-h-18 items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
        checked ? "border-brand/40 bg-brand/10" : "hover:bg-muted/50",
        className,
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
  isAlertSoundEnabled,
  isBroadcastActionPending,
  isDonationAlertEnabled,
  isDonationAmountVisible,
  isDonationEnabled,
  isLinkBlocked,
  isSlowModeEnabled,
  isSettingsActionPending,
  isTtsEnabled,
  settingsActionMessage,
  thumbnailPreviewName,
  thumbnailPreviewUrl,
  title,
  tagInput,
  tags,
  liveState,
  onAlertSoundEnabledChange,
  onDonationAlertEnabledChange,
  onDonationAmountVisibleChange,
  onDonationEnabledChange,
  onLinkBlockedChange,
  onSlowModeEnabledChange,
  onThumbnailFileChange,
  onThumbnailRemove,
  onTitleChange,
  onTtsEnabledChange,
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

        <div className="grid items-start gap-3 sm:grid-cols-2">
          <div className="grid gap-3">
            <div className="border-border rounded-lg border p-3 sm:min-h-72">
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
                  "border-border bg-muted mt-3 flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed bg-cover bg-center p-3 text-center",
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
                <span className="text-sm font-semibold">채팅 빠른 설정</span>
              </div>
              <div className="mt-3 grid gap-3">
                <SettingToggleButton
                  checked={isSlowModeEnabled}
                  description="채팅 입력 간격을 제한합니다."
                  icon={Timer}
                  label="저속모드"
                  onChange={onSlowModeEnabledChange}
                />
                <SettingToggleButton
                  checked={isLinkBlocked}
                  description="채팅에서 URL 공유를 차단합니다."
                  icon={Link2}
                  label="링크 차단"
                  onChange={onLinkBlockedChange}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="border-border rounded-lg border p-3 sm:min-h-72">
              <div className="flex items-center gap-2">
                <HandCoins className="text-brand size-4" />
                <span className="text-sm font-semibold">후원 빠른 설정</span>
              </div>
              <div className="mt-3 grid gap-2">
                <SettingToggleButton
                  checked={isDonationEnabled}
                  className="min-h-16"
                  description="시청자 후원을 받을 수 있게 설정합니다."
                  icon={HandCoins}
                  label="후원 받기"
                  onChange={onDonationEnabledChange}
                />
                <SettingToggleButton
                  checked={isDonationAmountVisible}
                  className="min-h-16"
                  description="후원 금액 표시 여부를 설정합니다."
                  icon={HandCoins}
                  label="후원 금액 공개"
                  onChange={onDonationAmountVisibleChange}
                />
                <SettingToggleButton
                  checked={isDonationAlertEnabled}
                  className="min-h-16"
                  description="후원 발생 시 방송 알림을 표시합니다."
                  icon={Bell}
                  label="후원 알림"
                  onChange={onDonationAlertEnabledChange}
                />
              </div>
            </div>

            <div className="border-border rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Bell className="text-brand size-4" />
                <span className="text-sm font-semibold">알림 빠른 설정</span>
              </div>
              <div className="mt-3 grid gap-3">
                <SettingToggleButton
                  checked={isAlertSoundEnabled}
                  description="후원 알림 사운드를 재생합니다."
                  icon={Volume2}
                  label="알림 사운드"
                  onChange={onAlertSoundEnabledChange}
                />
                <SettingToggleButton
                  checked={isTtsEnabled}
                  description="후원 메시지를 음성으로 읽습니다."
                  icon={Mic2}
                  label="TTS 사용"
                  onChange={onTtsEnabledChange}
                />
              </div>
            </div>
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
