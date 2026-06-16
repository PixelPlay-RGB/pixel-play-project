// 라이브 시청 페이지 — creatorId로 방송을 조회해 LiveView를 렌더링합니다.
// 시청 메타데이터는 layout.tsx의 generateMetadata가 담당한다.

import { getLivePlaybackUrl } from "@/app/live/[creatorId]/_data/live-playback-data";
import LiveShell from "@/components/live/live-shell";
import { PaymentResultToast } from "@/components/donations/payment-result-toast";
import { LiveView } from "@/components/live/view/live-view";
import { getPaymentResultCode } from "@/utils/payments/payment-result-code";

interface Props {
  params: Promise<{ creatorId: string }>;
  // 후원금 충전 결제 후 라이브 화면으로 복귀할 때 결과 토스트를 띄우기 위한 쿼리.
  searchParams: Promise<{ paymentStatus?: string | string[] }>;
}

export default async function LiveWatchPage({ params, searchParams }: Props) {
  const { creatorId } = await params;
  const { paymentStatus } = await searchParams;
  const hlsSrc = await getLivePlaybackUrl(creatorId);
  const paymentResultCode = getPaymentResultCode(paymentStatus);

  return (
    <LiveShell contentClassName="overflow-y-auto md:overflow-hidden">
      {/* 충전 결제 후 복귀 시 결과 토스트(후원 지갑 화면과 동일 컴포넌트 재사용) — 표시 후 쿼리를 정리한다. */}
      {paymentResultCode ? <PaymentResultToast code={paymentResultCode} /> : null}
      {/*
        key로 creatorId를 묶어, 같은 라우트(/live/[creatorId]) 안에서 다른 크리에이터로
        소프트 내비게이션할 때 LiveView를 재마운트해 시청 상태(sticky broadcastId·optimistic
        팔로우·채팅 접힘 등)가 이전 크리에이터에서 새어나오지 않게 한다.
      */}
      <LiveView key={creatorId} creatorId={creatorId} hlsSrc={hlsSrc} />
    </LiveShell>
  );
}
