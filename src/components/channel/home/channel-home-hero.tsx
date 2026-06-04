// 채널 홈 상단 Hero. 라이브 중이면 라이브 메인 Hero 재사용, 오프라인이면 안내 카드.
import { Radio } from "lucide-react";

import LiveHero from "@/components/live/live-hero";
import type { LiveHeroItem } from "@/types/live/live";

interface Props {
  hero: LiveHeroItem | null;
  creatorNickname: string;
}

export function ChannelHomeHero({ hero, creatorNickname }: Props) {
  if (hero) {
    return <LiveHero hero={hero} />;
  }

  return (
    <section className="border-border bg-card flex min-h-52 flex-col justify-between rounded-lg border-2 p-5 md:min-h-64 md:p-6">
      <span className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-lg">
        <Radio className="size-5" />
      </span>
      <div className="max-w-120 space-y-2">
        <h1 className="text-foreground text-2xl font-bold md:text-3xl">
          {creatorNickname} 님은 지금 오프라인이에요.
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
          방송이 시작되면 이곳에서 바로 시청할 수 있어요.
        </p>
      </div>
    </section>
  );
}
