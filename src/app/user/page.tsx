// 유저 설정 기본 경로를 프로필 설정으로 이동시킵니다.
import { redirect } from "next/navigation";

export default function UserPage() {
  redirect("/user/profile");
}
