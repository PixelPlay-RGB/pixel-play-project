import z from "zod/v3";

export const loginSchema = z.object({
  email: z.string().email({ message: "올바른 이메일 형식을 입력해주세요." }),
  password: z.string().min(1, { message: "비밀번호를 입력해주세요." }),
});

export const signUpBaseSchema = z.object({
  email: z.string().email({ message: "올바른 이메일 형식을 입력해주세요." }),
  // [PROD] 영문 대문자 1개 이상, 숫자 1개 이상, 특수문자(!@#$%^&*) 1개 이상, 최소 8자
  // password: z.string()
  //   .min(8, { message: "비밀번호는 8자 이상이어야 합니다." })
  //   .regex(/[A-Z]/, { message: "영문 대문자를 1개 이상 포함해야 합니다." })
  //   .regex(/[0-9]/, { message: "숫자를 1개 이상 포함해야 합니다." })
  //   .regex(/[!@#$%^&*]/, { message: "특수문자(!@#$%^&*)를 1개 이상 포함해야 합니다." }),
  // [TEST]
  password: z.string().min(6, { message: "비밀번호는 6자 이상이어야 합니다." }),
  passwordConfirm: z.string(),
  name: z.string().min(2, { message: "이름은 2자 이상이어야 합니다." }),
  nickname: z
    .string()
    .min(2, { message: "닉네임은 2자 이상이어야 합니다." })
    .max(10, { message: "닉네임은 10자 이하여야 합니다." })
    .regex(/^[a-zA-Z0-9가-힣\s]+$/, {
      message: "특수문자는 사용할 수 없습니다.",
    })
    .refine((val) => val.trim().length > 0, {
      message: "닉네임은 공백으로 설정할 수 없습니다.",
    }),
  birth: z.string().min(1, { message: "생년월일을 입력해주세요." }),
  phone: z
    .string()
    .regex(/^010-?\d{4}-?\d{4}$/, { message: "올바른 휴대전화번호 형식을 입력해주세요." }),
  gender: z.enum(["male", "female", "none"], { message: "성별을 선택해주세요." }),
});

export const signUpSchema = signUpBaseSchema.refine(
  (data) => data.password === data.passwordConfirm,
  {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  },
);

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;

export const completeOAuthProfileSchema = signUpBaseSchema.pick({
  name: true,
  nickname: true,
  birth: true,
  phone: true,
  gender: true,
});

export type CompleteOAuthProfileValues = z.infer<typeof completeOAuthProfileSchema>;

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
