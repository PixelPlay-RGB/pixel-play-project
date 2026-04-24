"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";
import { LoginProvider, OAuthProvider } from "@/types/auth";
import Image from "next/image";

interface OAuthButtonsProps {
  loading: LoginProvider | null;
  onLoadingChange: (provider: LoginProvider | null) => void;
}

export default function OAuthButtons({ loading, onLoadingChange }: OAuthButtonsProps) {
  const supabase = createClient();

  const handleSignIn = async (provider: OAuthProvider) => {
    onLoadingChange(provider);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error(`${provider} 로그인 에러: `, error.message);
      onLoadingChange(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        disabled={loading !== null}
        className="border-border/60 hover:border-brand/40 hover:bg-brand/5 w-full cursor-pointer gap-2 py-5 tracking-wide"
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
        className="hover:border-brand/40 w-full cursor-pointer gap-2 border border-[#30363d] bg-[#161b22] py-5 tracking-wide text-white hover:bg-[#21262d]"
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
