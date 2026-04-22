"use client";

import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export default function LoginButton() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [supabase]);

  const handleAuth = () => {
    startTransition(async () => {
      if (user) {
        await supabase.auth.signOut();
        setUser(null);
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
