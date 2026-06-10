"use client";
// 방송 썸네일 선택·미리보기·제거 상태를 관리합니다.

import { useEffect, useState } from "react";

import { isAutoLiveThumbnailUrl } from "@/utils/channel/channel-live-thumbnail";

export function useChannelLiveThumbnail(initialThumbnailUrl: string | null | undefined) {
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState(
    isAutoLiveThumbnailUrl(initialThumbnailUrl) ? "" : (initialThumbnailUrl ?? ""),
  );
  const [thumbnailPreviewName, setThumbnailPreviewName] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isThumbnailRemoved, setIsThumbnailRemoved] = useState(false);

  useEffect(() => {
    if (!thumbnailPreviewUrl.startsWith("blob:")) return;

    return () => {
      URL.revokeObjectURL(thumbnailPreviewUrl);
    };
  }, [thumbnailPreviewUrl]);

  const handleThumbnailFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) return;

    setThumbnailFile(file);
    setIsThumbnailRemoved(false);
    setThumbnailPreviewUrl(URL.createObjectURL(file));
    setThumbnailPreviewName(file.name);
  };

  const handleThumbnailRemove = () => {
    setThumbnailFile(null);
    setIsThumbnailRemoved(true);
    setThumbnailPreviewUrl("");
    setThumbnailPreviewName("");
  };

  return {
    handleThumbnailFileChange,
    handleThumbnailRemove,
    isThumbnailRemoved,
    setIsThumbnailRemoved,
    setThumbnailFile,
    setThumbnailPreviewName,
    setThumbnailPreviewUrl,
    thumbnailFile,
    thumbnailPreviewName,
    thumbnailPreviewUrl,
  };
}

export type ChannelLiveThumbnail = ReturnType<typeof useChannelLiveThumbnail>;
