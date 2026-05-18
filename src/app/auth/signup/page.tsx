import SignupForm from "@/components/auth/signup/signup-form";
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
          "m-auto w-full max-w-full p-5 sm:max-w-md sm:p-8",
          "bg-card/80 backdrop-blur-sm",
          "border-brand/20 border-0 border-t border-b",
          "sm:rounded-2xl sm:border",
          "md:border-2",
          "shadow-brand-panel",
        )}
      >
        <div className={cn("mb-4 flex flex-col items-center gap-3", "sm:mb-6 sm:gap-4")}>
          <Logo className="text-foreground" />
          <Separator className="bg-brand/40" />
          <p className="text-xs tracking-widest uppercase">회원가입</p>
        </div>

        <SignupForm />
      </div>
    </div>
  );
}
