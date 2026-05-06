"use client";

import { Separator } from "@/components/ui/separator";
import { LoginProvider } from "@/types/auth";
import { useState } from "react";
import LoginForm from "./login-form";
import OAuthButtons from "./oauth-buttons";

export default function LoginSection() {
  const [isLoading, setIsLoading] = useState<LoginProvider | null>(null);

  return (
    <>
      <LoginForm loading={isLoading} onLoadingChange={setIsLoading} />
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs tracking-widest uppercase">또는</span>
        <Separator className="flex-1" />
      </div>
      <OAuthButtons loading={isLoading} onLoadingChange={setIsLoading} />
    </>
  );
}
