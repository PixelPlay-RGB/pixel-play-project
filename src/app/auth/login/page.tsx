import AuthInputGroup from "@/components/auth/auth-input-group";
import AuthMainTitle from "@/components/auth/auth-main-title";
import LoginButton from "@/components/auth/login-button";
import { LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className={"container m-auto"}>
      <AuthMainTitle title={"로그인"} />
      <form className="m-auto flex max-w-md flex-col gap-5">
        <AuthInputGroup
          name={"email"}
          type={"email"}
          placeholder={"아이디(이메일)"}
          icon={<Mail />}
        />
        <AuthInputGroup
          name={"password"}
          type={"password"}
          placeholder={"비밀번호"}
          icon={<LockKeyhole />}
        />
        <LoginButton />
        <Link className={"cursor-pointer self-end underline"} href={"/auth/signup"}>
          회원 가입
        </Link>
      </form>
    </div>
  );
}
