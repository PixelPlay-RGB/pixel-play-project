import type { OAuthProvider } from "@/types/auth";

export const OAUTH_PROVIDERS: OAuthProvider[] = ["google", "github"] as const;

export const OAUTH_PROVIDER_META: Record<OAuthProvider, { name: string; logo: string }> = {
  google: { name: "Google", logo: "/google.svg" },
  github: { name: "GitHub", logo: "/github.svg" },
};

export const members = [
  { name: "전지호", github: "wjswlgh96" },
  { name: "이주영", github: "ele-003" },
  { name: "안혜진", github: "Hyejinjin-An" },
];

export const PROFILE_QUERY_KEY = ["profile"] as const;

export const WELCOME_PARAM = "?welcome=true";
export const LOGIN_PARAM = "?login=true";
export const LINKED_PARAM = "?linked=true";
