"use client";
// login-section 컴포넌트를 제공합니다.

import { Separator } from "@/components/ui/separator";
import { useLoginMutation, useOAuthLoginMutation } from "@/hooks/auth/use-login-mutation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import LoginForm from "./login-form";
import OAuthButtons from "./oauth-buttons";
import { createPathWithNext } from "@/utils/common/redirect";

interface Props {
  next: string;
}

export default function LoginSection({ next }: Props) {
  const loginMutation = useLoginMutation(next);
  const oauthMutation = useOAuthLoginMutation(next);
  const isBusy = loginMutation.isPending || oauthMutation.isPending;
  const signupLinkClassName = cn(
    "text-brand self-end text-sm underline underline-offset-4",
    "transition-colors hover:opacity-60 sm:self-end",
    isBusy && "pointer-events-none opacity-40 hover:opacity-40",
  );

  return (
    <>
      <LoginForm
        disabled={isBusy}
        isPending={loginMutation.isPending}
        onLogin={(values) => loginMutation.mutateAsync(values)}
      />
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs tracking-widest uppercase">또는</span>
        <Separator className="flex-1" />
      </div>
      <OAuthButtons
        disabled={isBusy}
        loadingProvider={oauthMutation.isPending ? (oauthMutation.variables ?? null) : null}
        onOAuthLogin={(provider) => oauthMutation.mutateAsync(provider)}
      />
      {isBusy ? (
        <span aria-disabled className={signupLinkClassName}>
          회원가입
        </span>
      ) : (
        <Link className={signupLinkClassName} href={createPathWithNext("/auth/signup", next)}>
          회원가입
        </Link>
      )}
    </>
  );
}
