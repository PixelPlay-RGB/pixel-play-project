import SignupForm from "@/components/auth/signup/signup-form";
import Logo from "@/components/common/logo";

export default function Page() {
  return (
    <div className="container m-auto">
      <div className="m-auto max-w-md rounded-2xl border border-brand/20 bg-card/80 p-8 shadow-[0_0_30px_#46c6a90a] backdrop-blur-sm dark:shadow-[0_0_60px_#46c6a918]">
        <div className="mb-6 flex flex-col items-center gap-4">
          <Logo className="text-[#1e1d37] dark:text-foreground" />
          <div className="h-px w-full bg-brand/20" />
          <p className="text-xs tracking-widest text-muted-foreground uppercase">회원가입</p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
