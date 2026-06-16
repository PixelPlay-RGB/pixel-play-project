"use client";
// 팔로우 토글 버튼 + 언팔로우 확인 다이얼로그를 묶은 재사용 컴포넌트.
// 팔로우는 즉시 실행하고, 언팔로우는 오클릭 방지를 위해 한 번 더 확인받는다.
// (라이브 시청·아바타 팝오버와 같은 공용 CreatorUnfollowDialog를 사용한다.)

import { useState } from "react";

import CreatorUnfollowDialog from "@/components/creator/creator-unfollow-dialog";
import CreatorFollowingButton from "@/components/following/creator-following-button";

interface Props {
  creatorNickname: string;
  isFollowing: boolean;
  isOwnChannel: boolean;
  isPending: boolean;
  // 실제 팔로우/언팔로우를 토글하는 동작(낙관적 업데이트 포함).
  onToggle: () => void;
  className?: string;
}

export default function CreatorFollowToggle({
  creatorNickname,
  isFollowing,
  isOwnChannel,
  isPending,
  onToggle,
  className,
}: Props) {
  const [isUnfollowDialogOpen, setIsUnfollowDialogOpen] = useState(false);

  function handleClick() {
    if (isFollowing) {
      setIsUnfollowDialogOpen(true);
    } else {
      onToggle();
    }
  }

  function handleConfirmUnfollow() {
    setIsUnfollowDialogOpen(false);
    onToggle();
  }

  return (
    <>
      <CreatorFollowingButton
        creatorNickname={creatorNickname}
        isFollowing={isFollowing}
        isOwnChannel={isOwnChannel}
        isPending={isPending}
        onClick={handleClick}
        className={className}
      />
      <CreatorUnfollowDialog
        open={isUnfollowDialogOpen}
        onOpenChange={setIsUnfollowDialogOpen}
        creatorNickname={creatorNickname}
        isPending={isPending}
        onConfirm={handleConfirmUnfollow}
      />
    </>
  );
}
