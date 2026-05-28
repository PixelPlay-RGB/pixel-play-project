// 채널 보안 설정 페이지를 렌더링합니다.
import { getChannelSecuritySnapshot } from "@/actions/channel/security";
import ChannelSecurityPageClient from "@/components/channel/security/channel-security-page-client";

export default async function ChannelSecurityPage() {
  const result = await getChannelSecuritySnapshot();

  return (
    <ChannelSecurityPageClient initialSnapshot={result.success ? (result.data ?? null) : null} />
  );
}
