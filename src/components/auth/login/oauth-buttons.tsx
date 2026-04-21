"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { OAuthProvider } from "@/types/auth";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

export default function OAuthButtons() {
  const [loading, setLoading] = useState<OAuthProvider | null>(null);

  const handleSignIn = async (provider: OAuthProvider) => {
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/" });
    setLoading(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        disabled={loading !== null}
        className="border-border/60 hover:border-brand/40 hover:bg-brand/5 w-full cursor-pointer py-5 tracking-wide"
        onClick={() => handleSignIn("google")}
      >
        {loading === "google" ? (
          <Spinner />
        ) : (
          <>
            <Image src="/google.svg" alt="Google" width={18} height={18} />
            Google 로그인
          </>
        )}
      </Button>
      <Button
        type="button"
        disabled={loading !== null}
        className="hover:border-brand/40 w-full cursor-pointer border border-[#30363d] bg-[#161b22] py-5 tracking-wide text-white hover:bg-[#21262d]"
        onClick={() => handleSignIn("github")}
      >
        {loading === "github" ? (
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
