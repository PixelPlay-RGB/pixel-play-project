// 구독 배지 업로드 파일의 PNG 헤더와 크기를 검증합니다.

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const PNG_IHDR_OFFSET = 12;
const PNG_WIDTH_OFFSET = 16;
const PNG_HEIGHT_OFFSET = 20;
const PNG_MIN_HEADER_LENGTH = 24;

export const CHANNEL_SUBSCRIPTION_BADGE_IMAGE_SIZE = 60;
export const CHANNEL_SUBSCRIPTION_BADGE_MAX_FILE_SIZE = 1 * 1024 * 1024;

export interface PngDimensions {
  width: number;
  height: number;
}

function hasPngSignature(bytes: Uint8Array) {
  return PNG_SIGNATURE.every((value, index) => bytes[index] === value);
}

function hasIhdrChunk(bytes: Uint8Array) {
  return (
    bytes[PNG_IHDR_OFFSET] === 0x49 &&
    bytes[PNG_IHDR_OFFSET + 1] === 0x48 &&
    bytes[PNG_IHDR_OFFSET + 2] === 0x44 &&
    bytes[PNG_IHDR_OFFSET + 3] === 0x52
  );
}

export function getPngDimensions(bytes: Uint8Array): PngDimensions | null {
  if (bytes.length < PNG_MIN_HEADER_LENGTH || !hasPngSignature(bytes) || !hasIhdrChunk(bytes)) {
    return null;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  return {
    width: view.getUint32(PNG_WIDTH_OFFSET, false),
    height: view.getUint32(PNG_HEIGHT_OFFSET, false),
  };
}

export function isValidSubscriptionBadgePng(bytes: Uint8Array) {
  const dimensions = getPngDimensions(bytes);

  return (
    dimensions?.width === CHANNEL_SUBSCRIPTION_BADGE_IMAGE_SIZE &&
    dimensions.height === CHANNEL_SUBSCRIPTION_BADGE_IMAGE_SIZE
  );
}
