// MediaMTX hook path를 PixelPlay 활성 방송 후보와 안전하게 매칭합니다.

export interface MediaMtxActiveBroadcastCandidate {
  broadcastId: string;
  creatorId: string;
  streamKeyVersion: number;
}

interface FindActiveBroadcastForMediaMtxPathParams {
  candidates: MediaMtxActiveBroadcastCandidate[];
  createStreamPath: (candidate: MediaMtxActiveBroadcastCandidate) => string;
  streamPath: string;
}

export function normalizeMediaMtxPath(streamPath: string) {
  const trimmed = streamPath.trim();

  try {
    return decodeURIComponent(trimmed).replace(/^\/+|\/+$/g, "");
  } catch {
    return trimmed.replace(/^\/+|\/+$/g, "");
  }
}

export function findActiveBroadcastForMediaMtxPath({
  candidates,
  createStreamPath,
  streamPath,
}: FindActiveBroadcastForMediaMtxPathParams) {
  const normalizedStreamPath = normalizeMediaMtxPath(streamPath);

  return (
    candidates.find((candidate) => {
      return normalizeMediaMtxPath(createStreamPath(candidate)) === normalizedStreamPath;
    }) ?? null
  );
}
