import SignupForm from "@/components/auth/signup/signup-form";
import Logo from "@/components/common/logo";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  return (
    <div className="container m-auto px-4 sm:px-0">
      <div className="border-brand/20 bg-card/80 m-auto max-w-md rounded-2xl border-2 p-5 sm:p-8 shadow-[0_0_30px_#46c6a90a] backdrop-blur-sm dark:shadow-[0_0_60px_#46c6a918]">
        <div className="mb-4 flex flex-col items-center gap-3 sm:mb-6 sm:gap-4">
          <Logo className="dark:text-foreground text-[#1e1d37]" />
          <Separator className="bg-brand/40" />
          <p className="text-xs tracking-widest uppercase">회원가입</p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
