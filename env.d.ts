namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
    NEXT_PUBLIC_SITE_URL?: string;
    NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS?: "true" | "false";
    NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY?: string;
    NEXT_PUBLIC_MEDIAMTX_RTMP_SERVER_URL?: string;
    NEXT_PUBLIC_MEDIAMTX_HLS_BASE_URL?: string;
    NEXT_PUBLIC_MEDIAMTX_STREAM_PATH?: string;

    SUPABASE_SERVICE_ROLE_KEY: string;
    LIVE_OVERLAY_TOKEN_SECRET: string;
    TOSS_PAYMENTS_SECRET_KEY?: string;
    MEDIAMTX_API_BASE_URL?: string;
    VERCEL_URL?: string;

    // 코드에서 직접 사용하지 않음 — Supabase 대시보드 OAuth 설정값 기록용.
    AUTH_SECRET?: string;
    AUTH_GOOGLE_CLIENT_ID?: string;
    AUTH_GOOGLE_CLIENT_SECRET?: string;
    AUTH_GITHUB_CLIENT_ID?: string;
    AUTH_GITHUB_CLIENT_SECRET?: string;
  }
}
