// 채널 보안 설정 페이지를 렌더링합니다.
import { ChannelSecurityPageContent } from "@/components/channel/security/channel-security-page-content";

import { getChannelSecuritySnapshot } from "./data";

export default async function ChannelSecurityPage() {
  const result = await getChannelSecuritySnapshot();

  return (
    <ChannelSecurityPageContent initialSnapshot={result.success ? (result.data ?? null) : null} />
  );
}
