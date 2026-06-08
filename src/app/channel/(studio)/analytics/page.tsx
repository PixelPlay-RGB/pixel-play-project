// 통계 분석 진입점을 실시간 통계 화면으로 리다이렉트합니다.
import { redirect } from "next/navigation";

export default function ChannelAnalyticsPage() {
  redirect("/channel/analytics/live");
}
