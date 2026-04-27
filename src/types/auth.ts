import { SignUpFormValues } from "@/lib/zod/auth";

export type OtpStatus = "idle" | "sending" | "sent" | "verifying" | "verified";
export type NicknameStatus = "idle" | "checking" | "available" | "taken";
export type LoginProvider = "google" | "github" | "email";
export type OAuthProvider = Exclude<LoginProvider, "email">;

export type CompleteSignupInput = Pick<
  SignUpFormValues,
  "password" | "name" | "nickname" | "birth" | "phone" | "gender"
>;

export type CompleteOAuthProfileInput = Pick<
  SignUpFormValues,
  "nickname" | "birth" | "phone" | "gender"
>;

export type { LoginFormValues, SignUpFormValues } from "@/lib/zod/auth";
