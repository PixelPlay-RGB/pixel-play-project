namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
    NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS?: "true" | "false";

    SUPABASE_SERVICE_ROLE_KEY: string;
  }
}
