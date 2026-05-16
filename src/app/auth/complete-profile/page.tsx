import CompleteProfileForm from "@/components/auth/complete-profile/complete-profile-form";
import Logo from "@/components/common/logo";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 이미 프로필이 완성된 유저가 직접 접근한 경우 홈으로
  const { data: profile, error: profileError } = await supabase
    .from("user")
    .select("nickname")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("추가 정보 입력 페이지에서 프로필 조회 실패", profileError);
  }

  if (profile?.nickname) {
    redirect("/");
  }

  return (
    <div className="container m-auto">
      <div
        className={cn(
          "m-auto max-w-md rounded-2xl border-2 p-8 backdrop-blur-sm",
          "shadow-brand-panel border-brand/20 bg-card/80",
        )}
      >
        <div className="mb-6 flex flex-col items-center gap-4">
          <Logo className="text-foreground" />
          <Separator className="bg-brand/40" />
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-xs tracking-widest uppercase">추가 정보 입력</p>
            <p className="text-muted-foreground text-xs">
              서비스 이용을 위해 추가 정보를 입력해주세요.
            </p>
          </div>
        </div>
        <CompleteProfileForm />
      </div>
    </div>
  );
}
