"use client";

import AuthListener from "@/components/auth/auth-listener";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { ReactNode, useState } from "react";

const isReactQueryDevtoolsEnabled = process.env.NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS === "true";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({}));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthListener />
        {children}
        {isReactQueryDevtoolsEnabled && <ReactQueryDevtools initialIsOpen={false} />}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
