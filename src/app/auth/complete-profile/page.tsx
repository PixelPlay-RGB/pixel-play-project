import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CompleteProfileForm from "@/components/auth/complete-profile/complete-profile-form";
import Logo from "@/components/common/logo";
import { Separator } from "@/components/ui/separator";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (session.profileComplete) redirect("/");

  return (
    <div className="container m-auto">
      <div className="border-brand/20 bg-card/80 m-auto max-w-md rounded-2xl border-2 p-8 shadow-[0_0_30px_#46c6a90a] backdrop-blur-sm dark:shadow-[0_0_60px_#46c6a918]">
        <div className="mb-6 flex flex-col items-center gap-4">
          <Logo className="dark:text-foreground text-[#1e1d37]" />
          <Separator className="bg-brand/40" />
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-xs tracking-widest uppercase">추가 정보 입력</p>
            <p className="text-muted-foreground text-xs">
              서비스 이용을 위해 추가 정보를 입력해주세요.
            </p>
          </div>
        </div>
        <CompleteProfileForm defaultDisplayName={session.user.name ?? ""} />
      </div>
    </div>
  );
}
