import { SignUpFormValues } from "@/lib/zod/auth";

export type OtpStatus = "idle" | "sending" | "sent" | "verifying" | "verified";

export type OAuthProvider = "google" | "github";

export type CompleteSignupInput = Pick<
  SignUpFormValues,
  "password" | "name" | "displayName" | "birth" | "phone" | "gender"
>;

export type CompleteOAuthProfileInput = Pick<
  SignUpFormValues,
  "displayName" | "birth" | "phone" | "gender"
>;

export type { LoginFormValues, SignUpFormValues } from "@/lib/zod/auth";
