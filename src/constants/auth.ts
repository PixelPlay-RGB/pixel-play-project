import type { OAuthProvider, SignUpFormValues } from "@/types/auth";

export const OAUTH_PROVIDERS: OAuthProvider[] = ["google", "github"] as const;
export const OAUTH_PROVIDER_META: Record<OAuthProvider, { name: string; logo: string }> = {
  google: { name: "Google", logo: "/google.svg" },
  github: { name: "GitHub", logo: "/github.svg" },
};

export const WELCOME_PARAM = "?welcome=true";
export const LOGIN_PARAM = "?login=true";
export const LINKED_PARAM = "?linked=true";

export const SIGNUP_FORM_DEFAULTS: SignUpFormValues = {
  email: "",
  password: "",
  passwordConfirm: "",
  name: "",
  nickname: "",
  birth: "",
  phone: "",
  gender: "male",
};
