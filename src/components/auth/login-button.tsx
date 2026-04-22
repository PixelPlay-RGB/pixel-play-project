"use client";

import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function LoginButton() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const [isPending, startTransition] = useTransition();

  const handleAuth = () => {
    startTransition(async () => {
      if (user) {
        const supabase = createClient();
        await supabase.auth.signOut();
        // onAuthStateChange가 store를 자동으로 null로 업데이트
        router.refresh();
      } else {
        router.push("/auth/login");
      }
    });
  };

  if (loading) return <Spinner />;

  return (
    <button
      className="border-brand/40 text-brand hover:bg-brand cursor-pointer rounded-lg border bg-transparent px-4 py-2 text-sm font-medium tracking-widest uppercase transition-all duration-200 hover:text-white"
      onClick={handleAuth}
    >
      {isPending ? <Spinner /> : user ? "로그아웃" : "로그인"}
    </button>
  );
}
