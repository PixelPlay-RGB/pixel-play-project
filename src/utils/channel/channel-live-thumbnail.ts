// 라이브 수동 썸네일과 자동 캡처 썸네일 경로를 구분합니다.

export const LIVE_THUMBNAIL_DIRECTORY = "live-thumbnail";
export const LIVE_MANUAL_THUMBNAIL_FILE_PREFIX = "thumbnail.";
export const LIVE_AUTO_THUMBNAIL_FILE_NAME = "auto-thumbnail.jpg";

export function isManualLiveThumbnailFileName(fileName: string) {
  return fileName.startsWith(LIVE_MANUAL_THUMBNAIL_FILE_PREFIX);
}

export function isAutoLiveThumbnailUrl(url: string | null | undefined) {
  const trimmedUrl = url?.trim();

  if (!trimmedUrl) {
    return false;
  }

  try {
    const pathname = decodeURIComponent(new URL(trimmedUrl).pathname);

    return pathname.includes(`/${LIVE_THUMBNAIL_DIRECTORY}/${LIVE_AUTO_THUMBNAIL_FILE_NAME}`);
  } catch {
    return trimmedUrl.includes(`/${LIVE_THUMBNAIL_DIRECTORY}/${LIVE_AUTO_THUMBNAIL_FILE_NAME}`);
  }
}
