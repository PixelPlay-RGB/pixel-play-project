"use client";
// 방송 제목, 태그, 미리보기 이미지와 방송 시작 제어를 렌더링합니다.

import type { ChannelLiveState } from "@/components/channel/live/channel-live-operation-page";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CircleStop, ImageIcon, Play, Save, Tag, Upload, X } from "lucide-react";
import { type ChangeEvent, type DragEvent, type ReactNode, useRef, useState } from "react";

interface Props {
  broadcastActionError: string | null;
  canSaveSettings: boolean;
  isBroadcastActionPending: boolean;
  isSettingsActionPending: boolean;
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
  canSaveSettings,
  isBroadcastActionPending,
  isSettingsActionPending,
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
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);

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

  const handleConfirmEndBroadcast = () => {
    onEndBroadcast();
    setIsEndDialogOpen(false);
  };

  return (
    // 풀블리드 섹션(ChannelLiveCollapsibleSection) 안에 들어가므로 카드 래퍼 없이 내용만 둔다.
    <div className="flex flex-col gap-5">
      {broadcastActionError && (
        <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-xs font-semibold">
          {broadcastActionError}
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
            className="bg-brand hover:bg-brand/90 text-brand-foreground h-10 shrink-0 px-4"
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
              // 라이브 키워드 chip(LiveTagLink)과 동일한 brand 톤으로 맞춘다.
              className="bg-brand/15 text-brand border-brand/20 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold"
              onClick={() => onRemoveTag(tag)}
            >
              #{tag}
              <X className="size-3" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        {secondaryPanel}

        <section className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <ImageIcon className="text-brand size-4" />
              <h3 className="text-foreground text-sm font-bold">미리보기 이미지</h3>
            </div>
          </div>
          {/* 카드 래퍼 없이 사각 이미지 영역 + 하단 액션만 둔다. */}
          <div className="flex flex-1 flex-col">
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
                "border-border bg-muted/30 flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed bg-cover bg-center p-3 text-center",
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
                  <span className="max-w-58 leading-relaxed">
                    이미지를 등록하지 않으면 방송 중인 화면을 자동으로 캡처해 썸네일로 사용합니다.
                  </span>
                </div>
              )}
            </div>
            <div className="mt-auto flex items-center justify-between gap-2 pt-3">
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
          disabled={isSettingsActionPending || !canSaveSettings}
          className="h-11 rounded-xl px-7 font-bold shadow-sm transition-all active:scale-95"
        >
          <Save className="size-4" />
          저장
        </Button>
        {liveState.isBroadcasting ? (
          <AlertDialog
            open={isEndDialogOpen}
            onOpenChange={(next) => !isBroadcastActionPending && setIsEndDialogOpen(next)}
          >
            <AlertDialogTrigger
              render={
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isBroadcastActionPending}
                  className="h-11 rounded-xl px-7 font-bold shadow-sm transition-all active:scale-95"
                >
                  <CircleStop className="size-4" />
                  방송 종료
                </Button>
              }
            />
            <AlertDialogContent size="sm" showCloseButton={false}>
              <AlertDialogHeader>
                <AlertDialogTitle>방송을 종료할까요?</AlertDialogTitle>
                <AlertDialogDescription>
                  종료하면 시청자에게 더 이상 라이브가 공개되지 않습니다. OBS 송출은 별도로
                  중지해주세요.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isBroadcastActionPending}>취소</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={isBroadcastActionPending}
                  onClick={handleConfirmEndBroadcast}
                >
                  방송 종료
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            type="button"
            className="bg-live hover:bg-live/90 shadow-live/20 text-live-foreground h-11 rounded-xl px-7 font-bold shadow-sm transition-all active:scale-95"
            onClick={onStartBroadcast}
            disabled={isBroadcastActionPending}
          >
            <Play className="size-4" />
            방송 시작
          </Button>
        )}
      </div>
    </div>
  );
}
