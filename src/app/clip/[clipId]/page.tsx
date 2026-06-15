// 클립 디테일 페이지 — ready 클립만 노출하고 쇼츠 스타일 뷰어를 렌더링합니다.
// 클립 메타데이터는 layout.tsx의 generateMetadata가 담당한다.

import { notFound } from "next/navigation";

import { ClipShortsView, type ClipShortsCreator } from "@/components/clip/clip-shorts-view";
import { getChannelProfile } from "@/utils/channel/channel-server";
import { getLiveClip } from "@/utils/clip/clip-server";

interface Props {
  params: Promise<{ clipId: string }>;
}

export default async function ClipDetailPage({ params }: Props) {
  const { clipId } = await params;
  const clip = await getLiveClip(clipId);

  // 미완성(pending/failed)·삭제된 클립은 존재하지 않는 것으로 다룬다(RLS도 ready만 공개).
  if (!clip) {
    notFound();
  }

  const profile = await getChannelProfile(clip.creatorId);
  const creator: ClipShortsCreator | null =
    profile.success && profile.data
      ? {
          id: profile.data.id,
          nickname: profile.data.nickname,
          photoUrl: profile.data.photoUrl,
          isFollowing: profile.data.isFollowing,
          followerCount: profile.data.followerCount,
          isOwnChannel: profile.data.isOwnChannel,
          isLive: profile.data.isLive,
        }
      : null;

  // key로 clipId를 묶어 다른 클립으로의 하드 진입 시 뷰어 상태를 재마운트한다.
  // (캐러셀 내 이동은 history.replaceState라 리렌더 없이 내부 상태로 처리된다.)
  return <ClipShortsView key={clip.id} initialClip={clip} creator={creator} />;
}
