"use client";
// 방송 제목, 태그, 미리보기 이미지와 방송 시작 제어를 렌더링합니다.

import { DestructiveAlertDialog } from "@/components/common/destructive-alert-dialog";
import { AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ChannelLiveState } from "@/types/channel/channel-live";
import { CircleStop, Play, Save, Tag, Upload, X } from "lucide-react";
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

      {/* 채팅 설정의 금칙어 필드와 동일한 입력 컴포넌트 스타일(통합 박스 + 내부 칩 목록). */}
      <div className="grid gap-2">
        <Label htmlFor="channel-live-tag">방송 태그</Label>
        <div
          className={cn(
            "border-border bg-muted/40 overflow-hidden rounded-xl border",
            "focus-within:border-brand/50 focus-within:ring-brand/20 transition-colors focus-within:ring-3",
          )}
        >
          <div className="flex items-center gap-4 py-1.5 pr-1.5 pl-3.5">
            <Input
              id="channel-live-tag"
              value={tagInput}
              maxLength={12}
              onChange={(event) => onTagInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return;
                if (event.key === "Enter") {
                  event.preventDefault();
                  onAddTag();
                }
              }}
              placeholder="태그를 입력해주세요"
              className={cn(
                "h-8 min-w-0 flex-1 border-0 px-0 py-0 shadow-none focus-visible:ring-0",
                "bg-transparent disabled:bg-transparent dark:bg-transparent dark:disabled:bg-transparent",
              )}
            />
            <span className="text-muted-foreground shrink-0 text-xs font-semibold whitespace-nowrap">
              {tagInput.length} / 12
            </span>
            <Button
              type="button"
              className="bg-brand hover:bg-brand/85 text-brand-foreground shrink-0 font-bold"
              onClick={onAddTag}
            >
              <Tag className="size-4" />
              태그 추가
            </Button>
          </div>

          <div className="border-border/60 border-t p-3">
            {tags.length > 0 ? (
              <div className="flex flex-wrap content-start gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    // 라이브 키워드 chip(LiveTagLink)과 동일한 brand 톤으로 맞춘다.
                    className="bg-brand/15 text-brand border-brand/20 hover:bg-brand hover:text-brand-foreground inline-flex h-7 items-center gap-1 rounded-full border px-3 text-xs font-bold transition-colors"
                    onClick={() => onRemoveTag(tag)}
                  >
                    #{tag}
                    <X className="size-3" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-1.5 text-center text-xs">
                아직 등록한 태그가 없어요.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        {secondaryPanel}

        <section className="flex min-w-0 flex-col gap-3">
          <h3 className="text-foreground text-sm font-bold">미리보기 이미지</h3>
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

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {/* 방송 종료는 서버 자동 동기화가 처리하므로(OBS 송출 종료 감지) 버튼은 즉시 종료용 보조 수단임을 안내한다. */}
        {liveState.isBroadcasting ? (
          <p className="text-muted-foreground mr-auto text-xs leading-5 text-pretty">
            방송 종료는 OBS Studio에서 송출을 끄면 잠시 후 자동으로 처리돼요. 버튼은 지금 바로
            종료하고 싶을 때 사용하세요.
          </p>
        ) : null}
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
          <Button
            type="button"
            variant="destructive"
            disabled={isBroadcastActionPending}
            className="h-11 rounded-xl px-7 font-bold shadow-sm transition-all active:scale-95"
            onClick={() => setIsEndDialogOpen(true)}
          >
            <CircleStop className="size-4" />
            방송 종료
          </Button>
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

      {/* 프로젝트 배너 헤더 Dialog 컨벤션 — 방송 종료는 되돌리기 어려운 액션이라 danger 톤(공통 셸). */}
      <DestructiveAlertDialog
        open={isEndDialogOpen}
        onOpenChange={(next) => {
          if (!isBroadcastActionPending) setIsEndDialogOpen(next);
        }}
        icon={<CircleStop />}
        title="방송을 종료할까요?"
        description="종료하면 시청자에게 더 이상 라이브가 공개되지 않습니다. OBS Studio에서 송출만 종료해도 잠시 후 자동으로 종료됩니다."
        contentClassName="sm:max-w-md"
        footerClassName="flex-row gap-2"
      >
        <AlertDialogCancel
          disabled={isBroadcastActionPending}
          className="border-border bg-background text-foreground hover:bg-muted h-10 min-w-24 rounded-xl px-4 font-semibold"
        >
          취소
        </AlertDialogCancel>
        <AlertDialogAction
          variant="destructive"
          disabled={isBroadcastActionPending}
          onClick={handleConfirmEndBroadcast}
          className="shadow-destructive/10 h-10 min-w-24 rounded-xl px-4 font-bold shadow-sm"
        >
          {isBroadcastActionPending ? <Spinner /> : "방송 종료"}
        </AlertDialogAction>
      </DestructiveAlertDialog>
    </div>
  );
}
