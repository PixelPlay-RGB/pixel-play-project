// 라이브 룰렛 이벤트를 Server-Sent Events 스트림으로 전달합니다.
import { createAdminClient } from "@/lib/supabase/admin-client";
import { liveRouletteSseStore } from "@/utils/live/live-roulette-sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ broadcastId: string }>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, context: RouteContext) {
  const { broadcastId } = await context.params;

  if (!UUID_PATTERN.test(broadcastId)) {
    return new Response(null, { status: 404 });
  }

  const supabase = createAdminClient();
  const { data: broadcast, error } = await supabase
    .from("live_broadcast")
    .select("id")
    .eq("id", broadcastId)
    .is("ended_at", null)
    .maybeSingle();

  if (error) {
    console.error("Live roulette SSE broadcast lookup failed", error);
    return new Response(null, { status: 500 });
  }

  if (!broadcast) {
    return new Response(null, { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let isClosed = false;

      function enqueue(message: string) {
        if (isClosed) return;

        controller.enqueue(encoder.encode(message));
      }

      const unsubscribe = liveRouletteSseStore.subscribe(broadcastId, enqueue);
      const keepAlive = setInterval(() => {
        enqueue(": keep-alive\n\n");
      }, 25000);

      function close() {
        if (isClosed) return;

        isClosed = true;
        clearInterval(keepAlive);
        unsubscribe();
        controller.close();
      }

      enqueue(": connected\n\n");

      _request.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
}
