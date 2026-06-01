"use client";
// login-button 컴포넌트를 제공합니다.

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { createPathWithNext } from "@/utils/common/redirect";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function LoginButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loading = useAuthStore((s) => s.loading);

  const handleAuth = () => {
    const query = searchParams.toString();
    const next = pathname === "/" ? "/live" : `${pathname}${query ? `?${query}` : ""}`;
    router.push(createPathWithNext("/auth/login", next));
  };

  if (loading) return <Spinner />;
  if (pathname === "/auth/login") return null;

  return (
    <button
      className={cn(
        "rounded-lg border border-transparent bg-transparent px-2 py-2 sm:px-4",
        "text-foreground text-sm font-medium whitespace-nowrap",
        "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        "cursor-pointer tracking-normal sm:tracking-widest",
        "transition-all duration-200",
      )}
      onClick={handleAuth}
    >
      로그인
    </button>
  );
}
