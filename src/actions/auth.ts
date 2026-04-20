"use server";

import { createClient } from "@/lib/supabase/server";
import { signUpSchema, type SignUpFormValues } from "@/lib/zod/auth";

export async function signUpAction(data: SignUpFormValues) {
  const parsed = signUpSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { email, password, name, birth, phone, gender } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, birth, phone, gender },
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
}
