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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Ban,
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
  alertVolume: number;
  broadcastActionError: string | null;
  chatScope: ChannelLiveChatScope;
  chatRuleText: string;
  donationAlertDurationSeconds: number;
  donationMinAmount: number;
  followerWaitSeconds: number;
  forbiddenWordInput: string;
  forbiddenWords: string[];
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
  slowModeSeconds: number;
  thumbnailPreviewName: string;
  thumbnailPreviewUrl: string;
  title: string;
  ttsRate: number;
  tagInput: string;
  tags: string[];
  liveState: ChannelLiveState;
  onAddForbiddenWord: () => void;
  onAlertSoundEnabledChange: (isAlertSoundEnabled: boolean) => void;
  onAlertVolumeChange: (alertVolume: number) => void;
  onChatScopeChange: (chatScope: ChannelLiveChatScope) => void;
  onChatRuleTextChange: (chatRuleText: string) => void;
  onDonationAlertDurationSecondsChange: (donationAlertDurationSeconds: number) => void;
  onDonationAlertEnabledChange: (isDonationAlertEnabled: boolean) => void;
  onDonationAmountVisibleChange: (isDonationAmountVisible: boolean) => void;
  onDonationEnabledChange: (isDonationEnabled: boolean) => void;
  onDonationMinAmountChange: (donationMinAmount: number) => void;
  onFollowerWaitSecondsChange: (followerWaitSeconds: number) => void;
  onForbiddenWordInputChange: (forbiddenWordInput: string) => void;
  onLinkBlockedChange: (isLinkBlocked: boolean) => void;
  onRemoveForbiddenWord: (word: string) => void;
  onSlowModeEnabledChange: (isSlowModeEnabled: boolean) => void;
  onSlowModeSecondsChange: (slowModeSeconds: number) => void;
  onThumbnailFileChange: (file: File) => void;
  onThumbnailRemove: () => void;
  onTitleChange: (title: string) => void;
  onTtsEnabledChange: (isTtsEnabled: boolean) => void;
  onTtsRateChange: (ttsRate: number) => void;
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
  { label: "모든 사람", value: "authenticated" },
  { label: "팔로워 전용", value: "follower" },
  { label: "운영자 전용", value: "manager" },
];

const FOLLOWER_WAIT_OPTIONS = [
  { label: "바로", value: 0 },
  { label: "5분", value: 300 },
  { label: "10분", value: 600 },
  { label: "30분", value: 1800 },
  { label: "1시간", value: 3600 },
  { label: "1일", value: 86400 },
  { label: "7일", value: 604800 },
];

const SLOW_MODE_OPTIONS = [3, 5, 10, 30, 60, 120, 300];
const DONATION_ALERT_DURATION_OPTIONS = [3, 5, 10, 15, 30];
const TTS_RATE_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

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
  alertVolume,
  broadcastActionError,
  chatScope,
  chatRuleText,
  donationAlertDurationSeconds,
  donationMinAmount,
  followerWaitSeconds,
  forbiddenWordInput,
  forbiddenWords,
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
  slowModeSeconds,
  thumbnailPreviewName,
  thumbnailPreviewUrl,
  title,
  ttsRate,
  tagInput,
  tags,
  liveState,
  onAddForbiddenWord,
  onAlertSoundEnabledChange,
  onAlertVolumeChange,
  onChatScopeChange,
  onChatRuleTextChange,
  onDonationAlertDurationSecondsChange,
  onDonationAlertEnabledChange,
  onDonationAmountVisibleChange,
  onDonationEnabledChange,
  onDonationMinAmountChange,
  onFollowerWaitSecondsChange,
  onForbiddenWordInputChange,
  onLinkBlockedChange,
  onRemoveForbiddenWord,
  onSlowModeEnabledChange,
  onSlowModeSecondsChange,
  onThumbnailFileChange,
  onThumbnailRemove,
  onTitleChange,
  onTtsEnabledChange,
  onTtsRateChange,
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
              <div className="mt-3 grid gap-2">
                <Label htmlFor="channel-live-follower-wait">팔로워 채팅 대기 시간</Label>
                <select
                  id="channel-live-follower-wait"
                  className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  value={followerWaitSeconds}
                  onChange={(event) => onFollowerWaitSecondsChange(Number(event.target.value))}
                >
                  {FOLLOWER_WAIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border-border rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Timer className="text-brand size-4" />
                <span className="text-sm font-semibold">저속모드</span>
              </div>
              <SettingToggleButton
                checked={isSlowModeEnabled}
                description="채팅 입력 간격을 제한합니다."
                icon={Timer}
                label="저속모드 사용"
                onChange={onSlowModeEnabledChange}
              />
              <div className="mt-3 flex flex-wrap gap-1">
                {SLOW_MODE_OPTIONS.map((seconds) => (
                  <button
                    key={seconds}
                    type="button"
                    className={cn(
                      "border-border h-8 rounded-md border px-2 text-xs font-semibold transition-colors",
                      slowModeSeconds === seconds
                        ? "bg-brand text-white"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => onSlowModeSecondsChange(seconds)}
                  >
                    {seconds}초
                  </button>
                ))}
              </div>
            </div>

            <div className="border-border rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Link2 className="text-brand size-4" />
                <span className="text-sm font-semibold">채팅 보호</span>
              </div>
              <SettingToggleButton
                checked={isLinkBlocked}
                description="채팅에서 URL 공유를 차단합니다."
                icon={Link2}
                label="링크 차단"
                onChange={onLinkBlockedChange}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border-border rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Ban className="text-brand size-4" />
                <span className="text-sm font-semibold">금지어 설정</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  value={forbiddenWordInput}
                  maxLength={30}
                  onChange={(event) => onForbiddenWordInputChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onAddForbiddenWord();
                    }
                  }}
                  placeholder="금지어를 입력하세요"
                />
                <Button type="button" variant="outline" onClick={onAddForbiddenWord}>
                  추가
                </Button>
              </div>
              <div className="border-border mt-3 flex min-h-12 flex-wrap items-center gap-2 rounded-lg border p-2">
                {forbiddenWords.length ? (
                  forbiddenWords.map((word) => (
                    <button
                      key={word}
                      type="button"
                      className="bg-destructive/10 text-destructive inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                      onClick={() => onRemoveForbiddenWord(word)}
                    >
                      {word}
                      <X className="size-3" />
                    </button>
                  ))
                ) : (
                  <span className="text-muted-foreground text-xs">등록된 금지어가 없습니다.</span>
                )}
              </div>
            </div>

            <div className="border-border rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Users className="text-brand size-4" />
                <span className="text-sm font-semibold">채팅 규칙</span>
              </div>
              <Textarea
                className="mt-3 min-h-28"
                value={chatRuleText}
                maxLength={300}
                onChange={(event) => onChatRuleTextChange(event.target.value)}
                placeholder="시청자가 채팅 전에 확인할 안내를 입력하세요."
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border-border rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <HandCoins className="text-brand size-4" />
                <span className="text-sm font-semibold">후원 설정</span>
              </div>
              <div className="mt-3 grid gap-3">
                <SettingToggleButton
                  checked={isDonationEnabled}
                  description="시청자 후원을 받을 수 있게 설정합니다."
                  icon={HandCoins}
                  label="후원 받기"
                  onChange={onDonationEnabledChange}
                />
                <SettingToggleButton
                  checked={isDonationAmountVisible}
                  description="채팅과 알림에 후원 금액을 표시합니다."
                  icon={HandCoins}
                  label="후원 금액 공개"
                  onChange={onDonationAmountVisibleChange}
                />
                <div className="grid gap-2">
                  <Label htmlFor="channel-live-donation-min-amount">최소 후원 금액</Label>
                  <Input
                    id="channel-live-donation-min-amount"
                    type="number"
                    min={1000}
                    max={1000000}
                    step={1000}
                    value={donationMinAmount}
                    onChange={(event) => onDonationMinAmountChange(Number(event.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="border-border rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Bell className="text-brand size-4" />
                <span className="text-sm font-semibold">후원 알림</span>
              </div>
              <div className="mt-3 grid gap-3">
                <SettingToggleButton
                  checked={isDonationAlertEnabled}
                  description="후원 발생 시 방송 알림을 표시합니다."
                  icon={Bell}
                  label="후원 알림"
                  onChange={onDonationAlertEnabledChange}
                />
                <div className="flex flex-wrap gap-1">
                  {DONATION_ALERT_DURATION_OPTIONS.map((seconds) => (
                    <button
                      key={seconds}
                      type="button"
                      className={cn(
                        "border-border h-8 rounded-md border px-2 text-xs font-semibold transition-colors",
                        donationAlertDurationSeconds === seconds
                          ? "bg-brand text-white"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      onClick={() => onDonationAlertDurationSecondsChange(seconds)}
                    >
                      {seconds}초
                    </button>
                  ))}
                </div>
                <SettingToggleButton
                  checked={isAlertSoundEnabled}
                  description="알림 사운드를 재생합니다."
                  icon={Volume2}
                  label="알림 사운드"
                  onChange={onAlertSoundEnabledChange}
                />
                <div className="grid gap-2">
                  <Label htmlFor="channel-live-alert-volume">알림 볼륨</Label>
                  <Input
                    id="channel-live-alert-volume"
                    type="number"
                    min={0}
                    max={100}
                    value={alertVolume}
                    onChange={(event) => onAlertVolumeChange(Number(event.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-border rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Mic2 className="text-brand size-4" />
              <span className="text-sm font-semibold">TTS 설정</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <SettingToggleButton
                checked={isTtsEnabled}
                description="후원 메시지를 음성으로 읽습니다."
                icon={Mic2}
                label="TTS 사용"
                onChange={onTtsEnabledChange}
              />
              <div className="flex flex-wrap content-start gap-1">
                {TTS_RATE_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    className={cn(
                      "border-border h-8 rounded-md border px-2 text-xs font-semibold transition-colors",
                      ttsRate === rate
                        ? "bg-brand text-white"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => onTtsRateChange(rate)}
                  >
                    {rate.toFixed(2)}x
                  </button>
                ))}
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
