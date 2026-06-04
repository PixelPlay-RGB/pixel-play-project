"use client";
// 채널 홈 배너 CRUD 필드. 이미지 업로드 + 제목 + 링크 등록, 위/아래 순서 변경, 삭제(즉시 반영).

import { HintNote } from "@/components/common/hint-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useChannelBanners } from "@/hooks/channel/use-channel-banners";
import {
  CHANNEL_BANNER_LINK_MAX,
  CHANNEL_BANNER_MAX,
  CHANNEL_BANNER_TITLE_MAX,
} from "@/lib/zod/channel-profile";
import { cn } from "@/lib/utils";
import type { ChannelBanner } from "@/types/channel/channel";
import { ChevronDown, ChevronUp, ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/bmp";
const HTTP_URL_PATTERN = /^https?:\/\/.+/;

interface Props {
  initialBanners: ChannelBanner[];
}

export function ChannelBannerField({ initialBanners }: Props) {
  const { banners, addBanner, isAdding, deleteBanner, isDeleting, move, isReordering, canAddMore } =
    useChannelBanners(initialBanners);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
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

  const canSubmit = !!file && HTTP_URL_PATTERN.test(linkUrl.trim()) && !isAdding;

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

  const busy = isAdding || isDeleting || isReordering;

  return (
    <div className="flex flex-col gap-4">
      {canAddMore && (
        <div className="border-border bg-muted/40 flex flex-col gap-3 rounded-xl border p-3 sm:flex-row">
          <button
            type="button"
            disabled={isAdding}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed",
              "border-border hover:border-brand/50 bg-background text-muted-foreground transition-colors",
              isAdding && "pointer-events-none opacity-60",
            )}
            aria-label="배너 이미지 업로드"
          >
            {preview ? (
              <Image src={preview} alt="배너 미리보기" fill unoptimized className="object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-xs font-semibold">
                <ImagePlus className="size-5" />
                업로드
                <span className="text-muted-foreground/70 text-[10px]">300×300</span>
              </span>
            )}
          </button>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Input
              value={title}
              disabled={isAdding}
              maxLength={CHANNEL_BANNER_TITLE_MAX}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="배너 제목을 입력해주세요."
            />
            <div className="flex gap-2">
              <Input
                value={linkUrl}
                disabled={isAdding}
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
                className="bg-brand hover:bg-brand/85 shrink-0 font-bold text-white"
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
        <ul className="flex flex-col gap-2">
          {banners.map((banner, index) => (
            <li
              key={banner.id}
              className="border-border/60 bg-background flex items-center gap-3 rounded-xl border p-2.5"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg">
                <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-bold">
                  {banner.title || "제목 없음"}
                </p>
                <p className="text-muted-foreground truncate text-xs">{banner.linkUrl}</p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  disabled={busy || index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="위로 이동"
                  className="text-muted-foreground hover:text-foreground rounded-md p-1.5 transition-colors disabled:opacity-30"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={busy || index === banners.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="아래로 이동"
                  className="text-muted-foreground hover:text-foreground rounded-md p-1.5 transition-colors disabled:opacity-30"
                >
                  <ChevronDown className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => deleteBanner(banner.id)}
                  aria-label={`${banner.title || "배너"} 삭제`}
                  className="text-muted-foreground hover:text-destructive rounded-md p-1.5 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground py-2 text-center text-xs">아직 등록한 배너가 없어요.</p>
      )}

      <HintNote>
        채널 홈 상단에 노출되는 외부 링크 배너예요. 최대 {CHANNEL_BANNER_MAX}개, 1MB 이하(jpg, png,
        webp, gif, bmp).
      </HintNote>
    </div>
  );
}
