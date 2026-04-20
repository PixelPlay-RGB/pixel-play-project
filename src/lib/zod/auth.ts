import z from "zod/v3";

export const signUpSchema = z.object({
  email: z.string().email({ message: "올바른 이메일 형식을 입력해주세요." }),
});
