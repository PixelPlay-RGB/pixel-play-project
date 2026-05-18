import LoginSection from "@/components/auth/login/login-section";
import Logo from "@/components/common/logo";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { redirectAuthenticatedUserFromAuthPage } from "@/utils/auth-page-server";

export default async function Page() {
  await redirectAuthenticatedUserFromAuthPage();

  return (
    <div className="container m-auto">
      <div
        className={cn(
          "bg-card/80 m-auto w-full p-5 backdrop-blur-sm",
          "border-brand/20 border-0 border-t border-b",
          "sm:max-w-md sm:rounded-2xl sm:border sm:p-8",
          "md:border-2",
          "shadow-brand-panel",
        )}
      >
        <div className="mb-4 flex flex-col items-center gap-3 sm:mb-6 sm:gap-4">
          <Logo className="text-foreground" />
          <Separator className="bg-brand/40" />
          <p className="text-xs tracking-widest uppercase">로그인</p>
        </div>
        <div className="flex flex-col gap-4 sm:gap-5">
          <LoginSection />
        </div>
      </div>
    </div>
  );
}
