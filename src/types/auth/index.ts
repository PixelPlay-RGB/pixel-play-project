import { SignUpFormValues } from "@/lib/zod/auth";

export type OtpStatus = "idle" | "sending" | "sent" | "verifying" | "verified";

export type OAuthProvider = "google" | "github";

export type CompleteSignupInput = Pick<
  SignUpFormValues,
  "password" | "name" | "birth" | "phone" | "gender"
>;

export type { LoginFormValues, SignUpFormValues } from "@/lib/zod/auth";
