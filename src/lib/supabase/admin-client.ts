// service role 키를 다루므로 클라이언트 번들 유입을 import 시점에 차단한다.
import "server-only";

import { Database } from "@/types/database.types";
import { createClient } from "@supabase/supabase-js";

export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Admin Client 생성 실패: 환경 변수가 존재하지 않습니다.");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
