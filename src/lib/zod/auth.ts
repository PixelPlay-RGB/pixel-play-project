import { FORM_MESSAGE } from "@/constants/form-message";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: FORM_MESSAGE.auth.emailInvalid }),
  password: z.string().min(1, { error: FORM_MESSAGE.auth.passwordRequired }),
});

const passwordSchema = z
  .string()
  .min(8, { error: FORM_MESSAGE.auth.passwordMin })
  .regex(/[a-z]/, { error: FORM_MESSAGE.auth.passwordLowercase })
  .regex(/[A-Z]/, { error: FORM_MESSAGE.auth.passwordUppercase })
  .regex(/[0-9]/, { error: FORM_MESSAGE.auth.passwordDigit })
  .regex(/[^A-Za-z0-9]/, { error: FORM_MESSAGE.auth.passwordSymbol });

const currentPasswordSchema = z.string().min(1, { error: FORM_MESSAGE.auth.passwordRequired });

export const signUpBaseSchema = z.object({
  email: z.email({ error: FORM_MESSAGE.auth.emailInvalid }),
  password: passwordSchema,
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
  currentPassword: currentPasswordSchema,
});

export const changePasswordSchema = z
  .object({
    newPassword: passwordSchema,
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
