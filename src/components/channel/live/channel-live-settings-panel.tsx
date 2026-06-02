"use client";
// 방송 제목, 태그, 미리보기 이미지와 방송 시작 제어를 렌더링합니다.

import type { ChannelLiveState } from "@/components/channel/live/channel-live-operation-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CircleStop, ImageIcon, Play, Save, Tag, Upload, X } from "lucide-react";
import { type ChangeEvent, type DragEvent, type ReactNode, useRef } from "react";

interface Props {
  broadcastActionError: string | null;
  isBroadcastActionPending: boolean;
  isSettingsActionPending: boolean;
  settingsActionMessage: string | null;
  secondaryPanel: ReactNode;
  thumbnailPreviewName: string;
  thumbnailPreviewUrl: string;
  title: string;
  tagInput: string;
  tags: string[];
  liveState: ChannelLiveState;
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

export default function ChannelLiveSettingsPanel({
  broadcastActionError,
  isBroadcastActionPending,
  isSettingsActionPending,
  settingsActionMessage,
  secondaryPanel,
  thumbnailPreviewName,
  thumbnailPreviewUrl,
  title,
  tagInput,
  tags,
  liveState,
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
    <Card className="gap-5 py-6 shadow-sm">
      <CardContent className="flex flex-col gap-5 px-5 sm:px-6">
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
              className="bg-brand hover:bg-brand/90 h-10 shrink-0 px-4 text-white"
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

        <div className="grid items-start gap-4 lg:grid-cols-2">
          {secondaryPanel}

          <section className="flex min-w-0 flex-col gap-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="text-brand size-4" />
              <h3 className="text-foreground text-sm font-bold">미리보기 이미지</h3>
            </div>
            <div className="border-border bg-muted/40 flex flex-col rounded-xl border p-4">
              <input
                ref={thumbnailInputRef}
                className="sr-only"
                id="channel-live-thumbnail"
                type="file"
                accept="image/*"
                onChange={handleThumbnailInputChange}
              />
              <div className="flex justify-center">
                <div
                  className={cn(
                    "border-border bg-background inline-flex aspect-video h-40 max-w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed bg-cover bg-center p-3 text-center sm:h-44",
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
                      <span>이미지를 끌어오거나 추가하세요</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                <span className="text-muted-foreground min-w-0 truncate text-xs font-semibold">
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
          </section>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onSaveSettings}
            disabled={isSettingsActionPending}
            className="h-11 rounded-xl px-7 font-bold shadow-sm transition-all active:scale-95"
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
              className="h-11 rounded-xl px-7 font-bold shadow-sm transition-all active:scale-95"
            >
              <CircleStop className="size-4" />
              방송 종료
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-brand hover:bg-brand/90 shadow-brand/20 h-11 rounded-xl px-7 font-bold text-white shadow-sm transition-all active:scale-95"
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
