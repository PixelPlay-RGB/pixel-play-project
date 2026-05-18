"use client";
// login-button 컴포넌트를 제공합니다.

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { usePathname, useRouter } from "next/navigation";

export default function LoginButton() {
  const router = useRouter();
  const pathname = usePathname();
  const loading = useAuthStore((s) => s.loading);

  const handleAuth = () => {
    router.push("/auth/login");
  };

  if (loading) return <Spinner />;
  if (pathname === "/auth/login") return null;

  return (
    <button
      className={cn(
        "bg-transparent px-4 py-2",
        "border-brand/40 rounded-lg border",
        "text-brand text-sm font-medium",
        "hover:bg-brand cursor-pointer tracking-widest hover:text-white",
        "transition-all duration-200",
      )}
      onClick={handleAuth}
    >
      로그인
    </button>
  );
}
