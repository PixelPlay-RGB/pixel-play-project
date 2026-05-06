import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import { AuthError } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증된 유저가 아닙니다." }, { status: 401 });
  }

  try {
    const adminClient = createAdminClient();

    const { error } = await adminClient.auth.admin.deleteUser(user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: "success" });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
