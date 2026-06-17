// 라이브 룰렛 이벤트를 Server-Sent Events 스트림으로 전달합니다.
import { createAdminClient } from "@/lib/supabase/admin-client";
import { isUuid } from "@/utils/common/uuid";
import { liveRouletteSseStore } from "@/utils/live/live-roulette-sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ broadcastId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { broadcastId } = await context.params;

  if (!isUuid(broadcastId)) {
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

  let closeStream: (() => void) | null = null;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let isClosed = false;
      const onAbort = () => close();

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
        _request.signal.removeEventListener("abort", onAbort);
        controller.close();
      }
      closeStream = close;

      enqueue(": connected\n\n");

      _request.signal.addEventListener("abort", onAbort, { once: true });
    },
    cancel() {
      closeStream?.();
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
