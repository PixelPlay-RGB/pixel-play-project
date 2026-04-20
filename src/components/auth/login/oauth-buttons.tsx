"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import Image from "next/image";

export default function OAuthButtons() {
  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        className="w-full cursor-pointer py-5"
        onClick={() => signIn("google", { callbackUrl: "/" })}
      >
        <Image src="/google.svg" alt="Google" width={20} height={20} />
        Google 로그인
      </Button>
      <Button
        type="button"
        className="w-full cursor-pointer border-[#24292e] bg-[#24292e] py-5 text-white hover:bg-[#3a3f47]"
        onClick={() => signIn("github", { callbackUrl: "/" })}
      >
        <Image src="/github.svg" alt="Github" width={20} height={20} />
        GitHub 로그인
      </Button>
    </div>
  );
}
