"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LoginProvider } from "@/types/auth";
import Image from "next/image";

interface OAuthButtonsProps {
  loading: LoginProvider | null;
  onLoadingChange: (provider: LoginProvider | null) => void;
}

export default function OAuthButtons({ loading, onLoadingChange }: OAuthButtonsProps) {
  const supabase = createClient();

  const handleSignIn = async (provider: Exclude<LoginProvider, "email">) => {
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
      {/* Google Login Button */}
      <Button
        type="button"
        variant="outline"
        disabled={loading !== null}
        onClick={() => handleSignIn("google")}
        className={cn(
          "w-full cursor-pointer gap-2 py-5 tracking-wide",
          "border-border/60 hover:border-brand/40 hover:bg-brand/5",
        )}
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

      {/* GitHub Login Button */}
      <Button
        type="button"
        disabled={loading !== null}
        onClick={() => handleSignIn("github")}
        className={cn(
          "w-full cursor-pointer gap-2 py-5 tracking-wide",
          "border border-[#30363d] bg-[#161b22] text-white",
          "hover:border-brand/40 hover:bg-[#21262d]",
        )}
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
