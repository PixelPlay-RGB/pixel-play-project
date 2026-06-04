namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
    NEXT_PUBLIC_SITE_URL?: string;
    NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS?: "true" | "false";
    NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY?: string;

    SUPABASE_SERVICE_ROLE_KEY: string;
    LIVE_OVERLAY_TOKEN_SECRET: string;
    VERCEL_URL?: string;
  }
}
