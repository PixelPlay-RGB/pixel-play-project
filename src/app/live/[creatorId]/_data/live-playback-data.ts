// 라이브 시청 플레이어의 HLS 재생 주소를 서버에서 계산합니다.
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin-client";
import {
  getChannelLiveHlsUrl,
  getChannelLiveStreamPath,
} from "@/constants/channel/channel-live-media";
import { buildLiveStreamKey } from "@/utils/live/live-security";
import { isUuid } from "@/utils/common/uuid";

const DEFAULT_STREAM_KEY_VERSION = 1;

export async function getLivePlaybackUrl(creatorId: string): Promise<string | null> {
  if (!isUuid(creatorId)) return null;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("creator_studio_setting")
      .select("stream_key_version")
      .eq("creator_id", creatorId)
      .maybeSingle();

    if (error) {
      console.error("라이브 재생 URL 설정 조회 실패", error);
      return null;
    }

    const streamKeyVersion = data?.stream_key_version ?? DEFAULT_STREAM_KEY_VERSION;
    const streamPath = getChannelLiveStreamPath(buildLiveStreamKey(creatorId, streamKeyVersion));

    return getChannelLiveHlsUrl(streamPath);
  } catch (error) {
    console.error("라이브 재생 URL 생성 실패", error);
    return null;
  }
}
