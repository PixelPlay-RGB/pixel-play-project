import LoginSection from "@/components/auth/login/login-section";
import Logo from "@/components/common/logo";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function Page() {
  return (
    <div className="container m-auto">
      <div
        className={cn(
          "bg-card/80 m-auto w-full p-5 backdrop-blur-sm",
          "border-brand/20 border-0 border-t border-b",
          "sm:max-w-md sm:rounded-2xl sm:border sm:p-8",
          "md:border-2",
          "shadow-[0_0_30px_#46c6a90a] dark:shadow-[0_0_60px_#46c6a918]",
        )}
      >
        <div className="mb-4 flex flex-col items-center gap-3 sm:mb-6 sm:gap-4">
          <Logo className="text-foreground" />
          <Separator className="bg-brand/40" />
          <p className="text-xs tracking-widest uppercase">로그인</p>
        </div>
        <div className="flex flex-col gap-4 sm:gap-5">
          <LoginSection />
          <Link
            className="text-brand self-end text-sm underline underline-offset-4 transition-colors hover:opacity-60 sm:self-end"
            href="/auth/signup"
          >
            회원 가입
          </Link>
        </div>
      </div>
    </div>
  );
}
