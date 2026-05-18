"use client";
// oauth-buttons 컴포넌트를 제공합니다.

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { OAuthProvider } from "@/types/auth";
import Image from "next/image";

interface OAuthButtonsProps {
  disabled: boolean;
  loadingProvider: OAuthProvider | null;
  onOAuthLogin: (provider: OAuthProvider) => Promise<unknown>;
}

export default function OAuthButtons({
  disabled,
  loadingProvider,
  onOAuthLogin,
}: OAuthButtonsProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Google Login Button */}
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => void onOAuthLogin("google").catch(() => undefined)}
        className={cn(
          "w-full cursor-pointer gap-2 py-5 tracking-wide",
          "border-border/60 hover:border-brand/40 hover:bg-brand/5",
        )}
      >
        {loadingProvider === "google" ? (
          <Spinner />
        ) : (
          <>
            <Image src="/google.svg" alt="Google" width={18} height={18} />
            Google 로그인
          </>
        )}
      </Button>

      {/* GitHub Login Button */}
      <Button
        type="button"
        disabled={disabled}
        onClick={() => void onOAuthLogin("github").catch(() => undefined)}
        className={cn(
          "w-full cursor-pointer gap-2 py-5 tracking-wide",
          "oauth-github-button border",
        )}
      >
        {loadingProvider === "github" ? (
          <Spinner />
        ) : (
          <>
            <Image src="/github.svg" alt="Github" width={18} height={18} className="invert" />
            GitHub 로그인
          </>
        )}
      </Button>
    </div>
  );
}
