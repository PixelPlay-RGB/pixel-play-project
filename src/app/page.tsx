import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import LinkedToast from "@/components/auth/linked-toast";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  return (
    <>
      <LinkedToast />
      <div>초기 인덱스 페이지 입니다.</div>
    </>
  );
}
