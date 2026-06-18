"use client";
// 채널 홈 배너 CRUD 필드. 추가/삭제는 즉시 반영, 순서는 드래그로 로컬 변경 후 "변경사항 저장"에서 커밋.

import DeleteConfirmDialog from "@/components/common/delete-confirm-dialog";
import { HintNote } from "@/components/common/hint-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { ChannelBannersController } from "@/hooks/channel/use-channel-banners";
import {
  CHANNEL_BANNER_LINK_MAX,
  CHANNEL_BANNER_MAX,
  CHANNEL_BANNER_TITLE_MAX,
  HTTP_URL_PATTERN,
} from "@/lib/zod/channel-profile";
import { cn } from "@/lib/utils";
import type { ChannelBanner } from "@/types/channel/channel";
import { GripVertical, ImagePlus, Trash2 } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/bmp";

interface Props {
  controller: ChannelBannersController;
}

export function ChannelBannerField({ controller }: Props) {
  const {
    banners,
    addBanner,
    isAdding,
    deleteBanner,
    isDeleting,
    isCommittingOrder,
    setOrder,
    canAddMore,
  } = controller;

  // 추가/삭제/순서커밋 중 하나라도 진행 중이면 모든 배너 조작을 잠가 상태 경합을 막는다.
  const busy = isAdding || isDeleting || isCommittingOrder;

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ChannelBanner | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = (next: File | null) => {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return next ? URL.createObjectURL(next) : null;
    });
    setFile(next);
  };

  const canSubmit = !!file && HTTP_URL_PATTERN.test(linkUrl.trim()) && !busy;

  const handleAdd = () => {
    if (!canSubmit || !file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());
    formData.append("linkUrl", linkUrl.trim());

    addBanner(formData, {
      onSuccess: (result) => {
        if (result.success) {
          handleFile(null);
          setTitle("");
          setLinkUrl("");
          if (inputRef.current) inputRef.current.value = "";
        }
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {canAddMore && (
        <div className="border-border bg-muted/40 flex flex-col gap-3 rounded-xl border p-3 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed",
              "border-border hover:border-brand/50 bg-background text-muted-foreground transition-colors",
              busy && "pointer-events-none opacity-60",
            )}
            aria-label="배너 이미지 업로드"
          >
            {preview ? (
              <Image src={preview} alt="배너 미리보기" fill unoptimized className="object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-xs font-semibold">
                <ImagePlus className="size-5" />
                업로드
                <span className="text-muted-foreground/70 text-2xs">300×300</span>
              </span>
            )}
          </button>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Input
              value={title}
              disabled={busy}
              maxLength={CHANNEL_BANNER_TITLE_MAX}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="배너 제목을 입력해주세요."
            />
            <div className="flex gap-2">
              <Input
                value={linkUrl}
                disabled={busy}
                maxLength={CHANNEL_BANNER_LINK_MAX}
                onChange={(event) => setLinkUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing) return;
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder="배너 링크 URL (https://)"
                className="min-w-0 flex-1"
              />
              <Button
                type="button"
                disabled={!canSubmit}
                onClick={handleAdd}
                className="bg-brand hover:bg-brand/85 text-brand-foreground h-auto shrink-0 self-stretch font-bold"
              >
                {isAdding ? <Spinner className="size-4" /> : "등록"}
              </Button>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(event) => {
              const next = event.target.files?.[0] ?? null;
              handleFile(next);
              event.target.value = "";
            }}
          />
        </div>
      )}

      {banners.length > 0 ? (
        <Reorder.Group
          as="ul"
          axis="y"
          values={banners}
          onReorder={setOrder}
          className="flex flex-col gap-2"
        >
          {banners.map((banner) => (
            <BannerReorderItem
              key={banner.id}
              banner={banner}
              disabled={busy}
              onRequestDelete={() => setPendingDelete(banner)}
            />
          ))}
        </Reorder.Group>
      ) : (
        <p className="text-muted-foreground py-2 text-center text-xs">아직 등록한 배너가 없어요.</p>
      )}

      <HintNote>
        드래그해서 순서를 바꾼 뒤 변경사항 저장을 누르면 반영돼요. 채널 홈 상단에 노출되는 외부 링크
        배너예요. 최대 {CHANNEL_BANNER_MAX}개, 1MB 이하(jpg, png, webp, gif, bmp).
      </HintNote>

      <DeleteConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="배너 삭제"
        description="삭제하면 채널 홈에서 사라지며 복구할 수 없어요."
        isPending={isDeleting}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteBanner(pendingDelete.id, {
            onSuccess: (result) => {
              if (result.success) setPendingDelete(null);
            },
          });
        }}
      />
    </div>
  );
}

interface BannerReorderItemProps {
  banner: ChannelBanner;
  disabled: boolean;
  onRequestDelete: () => void;
}

function BannerReorderItem({ banner, disabled, onRequestDelete }: BannerReorderItemProps) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={banner}
      dragListener={false}
      dragControls={controls}
      className="border-border/60 bg-background flex items-center gap-2.5 rounded-xl border p-2.5"
    >
      <button
        type="button"
        aria-label="드래그하여 순서 변경"
        onPointerDown={(event) => {
          if (disabled) return;
          event.preventDefault();
          controls.start(event);
        }}
        className={cn(
          "text-muted-foreground hover:text-foreground shrink-0 cursor-grab touch-none rounded-md p-1 transition-colors active:cursor-grabbing",
          disabled && "pointer-events-none opacity-40",
        )}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg">
        <Image
          src={banner.imageUrl}
          alt={banner.title || "배너"}
          fill
          sizes="56px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-bold">{banner.title || "제목 없음"}</p>
        <p className="text-muted-foreground truncate text-xs">{banner.linkUrl}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onRequestDelete}
        aria-label={`${banner.title || "배너"} 삭제`}
        className="text-muted-foreground hover:text-destructive shrink-0 rounded-md p-1.5 transition-colors disabled:opacity-50"
      >
        <Trash2 className="size-4" />
      </button>
    </Reorder.Item>
  );
}
