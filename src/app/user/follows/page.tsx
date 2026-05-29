// 기존 follows 경로를 팔로잉 경로로 이동시킵니다.
import { redirect } from "next/navigation";

export default function UserFollowsPage() {
  redirect("/user/following");
}
