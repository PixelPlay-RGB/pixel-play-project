import { FORM_MESSAGE } from "@/constants/form-message";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: FORM_MESSAGE.auth.emailInvalid }),
  password: z.string().min(1, { error: FORM_MESSAGE.auth.passwordRequired }),
});

export const signUpBaseSchema = z.object({
  email: z.email({ error: FORM_MESSAGE.auth.emailInvalid }),
  // [PROD] 영문 대문자 1개 이상, 숫자 1개 이상, 특수문자(!@#$%^&*) 1개 이상, 최소 8자
  // password: z.string()
  //   .min(8, { error: "비밀번호는 8자 이상이어야 합니다." })
  //   .regex(/[A-Z]/, { error: "영문 대문자를 1개 이상 포함해야 합니다." })
  //   .regex(/[0-9]/, { error: "숫자를 1개 이상 포함해야 합니다." })
  //   .regex(/[!@#$%^&*]/, { error: "특수문자(!@#$%^&*)를 1개 이상 포함해야 합니다." }),
  // [TEST]
  password: z.string().min(6, { error: FORM_MESSAGE.auth.passwordMin }),
  passwordConfirm: z.string(),
  name: z.string().min(2, { error: FORM_MESSAGE.auth.nameMin }),
  nickname: z
    .string()
    .min(2, { error: FORM_MESSAGE.auth.nicknameMin })
    .max(10, { error: FORM_MESSAGE.auth.nicknameMax })
    .regex(/^[a-zA-Z0-9가-힣\s]+$/, {
      error: FORM_MESSAGE.auth.nicknameInvalidCharacters,
    })
    .refine((val) => val.trim().length > 0, {
      error: FORM_MESSAGE.auth.nicknameBlank,
    }),
  birth: z.string().min(1, { error: FORM_MESSAGE.auth.birthRequired }),
  phone: z.string().regex(/^010-?\d{4}-?\d{4}$/, { error: FORM_MESSAGE.auth.phoneInvalid }),
  gender: z.enum(["male", "female", "none"], { error: FORM_MESSAGE.auth.genderRequired }),
});

export const signUpSchema = signUpBaseSchema.refine(
  (data) => data.password === data.passwordConfirm,
  {
    error: FORM_MESSAGE.auth.passwordMismatch,
    path: ["passwordConfirm"],
  },
);

export const completeOAuthProfileSchema = signUpBaseSchema.pick({
  name: true,
  nickname: true,
  birth: true,
  phone: true,
  gender: true,
});

export const verifyPasswordSchema = z.object({
  currentPassword: signUpBaseSchema.shape.password,
});

export const changePasswordSchema = z
  .object({
    newPassword: signUpBaseSchema.shape.password,
    newPasswordConfirm: z.string(),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    error: FORM_MESSAGE.auth.passwordMismatch,
    path: ["newPasswordConfirm"],
  });

export const profileSchema = z.object({
  nickname: signUpBaseSchema.shape.nickname,
  photoUrl: z.url().nullable().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type CompleteOAuthProfileValues = z.infer<typeof completeOAuthProfileSchema>;
export type VerifyPasswordValues = z.infer<typeof verifyPasswordSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
