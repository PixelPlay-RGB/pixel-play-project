import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const USER_MEDIA_BUCKET = "user-media";

// user-media/{userId}/ 하위 전체 파일 경로를 재귀적으로 수집한다.
async function listAllFiles(
  supabase: ReturnType<typeof createClient>,
  prefix: string,
): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(USER_MEDIA_BUCKET)
    .list(prefix, { limit: 1000 });
  if (error) throw error;

  const paths: string[] = [];
  for (const item of data ?? []) {
    const path = `${prefix}/${item.name}`;
    // 폴더는 id가 null → 재귀, 파일은 경로 수집
    if (item.id === null) {
      paths.push(...(await listAllFiles(supabase, path)));
    } else {
      paths.push(path);
    }
  }
  return paths;
}

Deno.serve(async (req: Request) => {
  const payload = await req.json();

  // Database Webhook DELETE 이벤트는 old_record에 삭제된 유저 정보를 담음
  const userId = payload.old_record?.id ?? payload.record?.id;

  if (!userId) {
    return new Response(JSON.stringify({ error: "No user ID in payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let filePaths: string[];
  try {
    filePaths = await listAllFiles(supabase, userId);
  } catch (e) {
    console.error("[delete-user-storage] list error:", (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (filePaths.length === 0) {
    return new Response(JSON.stringify({ message: "No files to delete", userId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: deleteError } = await supabase.storage
    .from(USER_MEDIA_BUCKET)
    .remove(filePaths);

  if (deleteError) {
    console.error("[delete-user-storage] delete error:", deleteError.message);
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("[delete-user-storage] deleted:", filePaths);

  return new Response(JSON.stringify({ deleted: filePaths, userId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
