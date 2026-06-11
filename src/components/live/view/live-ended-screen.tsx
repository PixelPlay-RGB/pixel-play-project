// 방송이 종료/오프라인(broadcast=null)일 때 송출(video) 자리를 대체하는 다크 프레임.
// <video> 대신 같은 aspect-video 검은 박스에 종료 안내와 이동 버튼을 보여준다.
// 크리에이터 신원(아바타·이름·팔로우)은 아래 스트리머 정보 행이 담당하므로 여기선 중복하지 않는다.

import Link from "next/link";
import { VideoOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LIVE_LABEL } from "@/constants/live/live";
import type { LiveCreator } from "@/types/live/live";

interface Props {
  creator: LiveCreator | null;
}

export function LiveEndedScreen({ creator }: Props) {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-white/10 text-white/70">
          <VideoOff className="size-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-white">{LIVE_LABEL.broadcastOfflineTitle}</h2>
          <p className="text-sm text-white/70">{LIVE_LABEL.broadcastOffline}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {creator ? (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/channel/${creator.id}`} />}
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              {LIVE_LABEL.viewChannel}
            </Button>
          ) : null}
          <Button
            nativeButton={false}
            render={<Link href="/live" />}
            className="bg-white text-black hover:bg-white/90"
          >
            {LIVE_LABEL.browseLive}
          </Button>
        </div>
      </div>
    </div>
  );
}
