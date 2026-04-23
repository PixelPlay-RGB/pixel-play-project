"use client";

import { useProfile } from "@/hooks/use-profile";

export default function UserInfoSection() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) return null;

  return <div>{profile.nickname}님 환영합니다!</div>;
}
