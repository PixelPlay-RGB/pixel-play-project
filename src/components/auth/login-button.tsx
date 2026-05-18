"use client";
// login-button 컴포넌트를 제공합니다.

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { createPathWithNext } from "@/utils/redirect";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function LoginButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loading = useAuthStore((s) => s.loading);

  const handleAuth = () => {
    const query = searchParams.toString();
    const next = `${pathname}${query ? `?${query}` : ""}`;
    router.push(createPathWithNext("/auth/login", next));
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
