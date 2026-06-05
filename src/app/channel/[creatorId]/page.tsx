// 채널 홈. MVP에서는 커뮤니티 탭을 기본 화면으로 사용합니다.
import { redirect } from "next/navigation";

export default async function ChannelHomePage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;

  redirect(`/channel/${creatorId}/community`);
}
