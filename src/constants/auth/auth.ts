// auth 상수를 정의합니다.
import type { OAuthProvider, SignUpFormValues } from "@/types/auth/auth";
import type { DefaultValues } from "react-hook-form";

export const OAUTH_PROVIDERS: OAuthProvider[] = ["google", "github"] as const;
export const OAUTH_PROVIDER_META: Record<OAuthProvider, { name: string; logo: string }> = {
  google: { name: "Google", logo: "/google.svg" },
  github: { name: "GitHub", logo: "/github.svg" },
};

export const WELCOME_PARAM = "?welcome=true";
export const LOGIN_PARAM = "?login=true";
export const LINKED_PARAM = "?linked=true";

export const SIGNUP_FORM_DEFAULTS: DefaultValues<SignUpFormValues> = {
  email: "",
  password: "",
  passwordConfirm: "",
  name: "",
  nickname: "",
  birth: "",
  phone: "",
};
