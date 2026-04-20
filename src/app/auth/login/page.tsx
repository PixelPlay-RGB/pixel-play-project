import AuthMainTitle from "@/components/auth/auth-main-title";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import LoginForm from "../../../components/auth/login/login-form";
import OAuthButtons from "../../../components/auth/login/oauth-buttons";

export default function Page() {
  return (
    <div className="container m-auto">
      <AuthMainTitle title="로그인" />
      <div className="m-auto flex max-w-md flex-col gap-5">
        <LoginForm />
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-muted-foreground text-sm">또는</span>
          <Separator className="flex-1" />
        </div>
        <OAuthButtons />
        <Link className="cursor-pointer self-end underline" href="/auth/signup">
          회원 가입
        </Link>
      </div>
    </div>
  );
}
