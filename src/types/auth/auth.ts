// auth 도메인 타입을 정의합니다.
import { SignUpFormValues } from "@/lib/zod/auth";
import type { AppActionResult } from "@/types/common/action";
import type { AuthUser } from "@/types/profile/user";

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

export interface UpdateProfileForm {
  nickname: string;
  file?: File;
  photoUrl?: string;
}

export type { LoginFormValues, SignUpFormValues } from "@/lib/zod/auth";

export type AuthenticatedActorResult =
  | {
      success: true;
      userId: string;
    }
  | {
      success: false;
      result: AppActionResult;
    };

export interface UserState {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
}
