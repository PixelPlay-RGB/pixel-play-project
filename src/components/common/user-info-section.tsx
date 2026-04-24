"use client";

import { useUser } from "@/hooks/use-profile";

export default function UserInfoSection() {
  const { data: user, isLoading } = useUser();

  if (isLoading || !user) {
    return null;
  }

  return <div>{user.nickname}님 환영합니다!</div>;
}
