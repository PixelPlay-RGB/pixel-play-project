"use client";

import { Spinner } from "@/components/ui/spinner";
import { signIn, signOut, useSession } from "next-auth/react";

export default function LoginButton() {
  const { data: session, status } = useSession();

  return (
    <button
      className="cursor-pointer rounded-lg border border-brand/40 bg-transparent px-4 py-2 text-sm font-medium tracking-widest text-brand transition-all duration-200 uppercase hover:bg-brand hover:text-white"
      onClick={() => {
        if (session) {
          signOut();
        } else {
          signIn(undefined, { callbackUrl: "/" });
        }
      }}
    >
      {status === "loading" ? <Spinner /> : session ? "로그아웃" : "로그인"}
    </button>
  );
}
