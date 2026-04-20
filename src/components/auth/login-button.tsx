"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { signIn, signOut, useSession } from "next-auth/react";

export default function LoginButton() {
  const { data: session, status } = useSession();

  return (
    <Button
      className={"py-5"}
      onClick={() => {
        if (session) {
          signOut();
        } else {
          signIn(undefined, { callbackUrl: "/" });
        }
      }}
    >
      {status === "loading" ? <Spinner /> : session ? "로그아웃" : "로그인"}
    </Button>
  );
}
