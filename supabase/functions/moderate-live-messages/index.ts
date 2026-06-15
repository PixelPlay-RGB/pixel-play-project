import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// 클린봇 LLM 판정(#120) — pg_cron(20초)이 호출하며, 아직 판정되지 않은 최근 채팅을
// 모아 Gemini에 1회 배치 판정을 요청하고 결과를 metadata.cleanbotStatus로 기록한다.
// 채팅 전송·표시는 이 함수와 무관하게 즉시 동작한다(비동기 사후 판정, fail-open) —
// 판정 실패 시 메시지는 미판정으로 남아 다음 주기에 재시도되고, 화면에서는 가려지지 않는다.
// 배치(최대 20건/회)인 이유: Gemini 무료 티어의 분당·일일 호출 한도 안에서 운용하기 위함.

const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_REQUEST_TIMEOUT_MS = 15 * 1000;
// 한 번에 판정할 최대 메시지 수 — 초과분은 다음 주기(20초 뒤)에 처리된다.
const MODERATION_BATCH_SIZE = 20;
// 이 시간보다 오래된 미판정 메시지는 건너뛴다(장애 복구 시 과거분 폭주 방지, fail-open 유지).
const MODERATION_WINDOW_MS = 10 * 60 * 1000;

const MODERATION_SYSTEM_PROMPT = `당신은 한국어 라이브 스트리밍 채팅의 클린봇 판정기입니다.
각 메시지가 다음에 해당하면 부적절로 판정합니다:
- 욕설·비속어 (초성, 숫자·기호 치환, 띄어쓰기 등 변형·우회 표현 포함)
- 혐오·차별 표현 (성별, 지역, 장애, 인종, 종교 등)
- 성희롱·외설적 표현
- 특정인을 향한 인신공격·모욕·조롱

다음은 부적절로 판정하지 않습니다:
- 가벼운 감탄·인터넷 밈 표현 ("헐", "ㅋㅋㅋ", "미쳤다"처럼 감탄으로 쓰인 경우)
- 게임/방송 내용에 대한 부정적이지만 공격적이지 않은 의견
- 맥락상 친근한 농담

번호가 매겨진 메시지 목록을 보고, 부적절한 메시지의 번호만 flagged 배열에 담아 응답하세요. 없으면 빈 배열을 반환하세요.`;

interface PendingMessageRow {
  id: string;
  content: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function requestGeminiFlaggedIndices(apiKey: string, contents: string[]) {
  // 본문 개행이 번호 목록 구분을 깨뜨리지 않게 한 줄로 정규화한다.
  const numberedList = contents
    .map((content, index) => `${index + 1}. ${content.replace(/\s+/g, " ").trim()}`)
    .join("\n");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: MODERATION_SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: numberedList }] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: { flagged: { type: "ARRAY", items: { type: "INTEGER" } } },
              required: ["flagged"],
            },
          },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini 응답 실패: ${response.status}`);
    }

    const payload: unknown = await response.json();
    const text = (payload as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
      .candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string") {
      throw new Error("Gemini 응답에 판정 텍스트가 없습니다");
    }

    const parsed: unknown = JSON.parse(text);
    const flagged = (parsed as { flagged?: unknown }).flagged;

    if (!Array.isArray(flagged)) {
      throw new Error("Gemini 판정 형식이 올바르지 않습니다");
    }

    // 1-based 번호만 신뢰하고 범위 밖 값은 버린다.
    return flagged.filter(
      (value): value is number =>
        typeof value === "number" &&
        Number.isInteger(value) &&
        value >= 1 &&
        value <= contents.length,
    );
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req: Request) => {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

  // sync-live-broadcast-status와 동일한 인증 — cron이 Vault의 service_role_key를 Bearer로 전달한다.
  const authHeader = req.headers.get("Authorization");
  let isAuthorized = authHeader === `Bearer ${serviceRoleKey}`;

  if (!isAuthorized && authHeader) {
    const { data: cronSecret } = await supabase.rpc("get_live_sync_cron_secret");

    isAuthorized = typeof cronSecret === "string" && authHeader === `Bearer ${cronSecret}`;
  }

  if (!isAuthorized) {
    return json({ error: "unauthorized" }, 401);
  }

  const geminiApiKey = Deno.env.get("GEMINI_API_KEY")?.trim();

  if (!geminiApiKey) {
    return json({ error: "GEMINI_API_KEY not configured" }, 503);
  }

  // 미판정 채팅 수집 — 방장 메시지는 본인 채널 운영 발언이므로 판정 대상에서 제외한다.
  const windowStart = new Date(Date.now() - MODERATION_WINDOW_MS).toISOString();
  const { data: pending, error: pendingError } = await supabase
    .from("live_message")
    .select("id, content")
    .eq("message_type", "chat")
    .eq("is_chat_visible", true)
    .neq("sender_role", "creator")
    .filter("metadata->>cleanbotStatus", "is", null)
    .gte("created_at", windowStart)
    .order("created_at", { ascending: true })
    .limit(MODERATION_BATCH_SIZE)
    .returns<PendingMessageRow[]>();

  if (pendingError) {
    console.error("[moderate-live-messages] pending query error:", pendingError.message);
    return json({ error: pendingError.message }, 500);
  }

  if (!pending?.length) {
    return json({ checked: 0, flagged: 0 });
  }

  let flaggedIndices: number[];

  try {
    flaggedIndices = await requestGeminiFlaggedIndices(
      geminiApiKey,
      pending.map((message) => message.content),
    );
  } catch (error) {
    // 판정 실패 시 미판정으로 남겨 다음 주기에 재시도한다(채팅 표시는 영향 없음).
    console.error("[moderate-live-messages] gemini error:", (error as Error).message);
    return json({ checked: pending.length, flagged: 0, retried: true });
  }

  const flaggedIdSet = new Set(flaggedIndices.map((index) => pending[index - 1].id));
  const flaggedIds = pending.filter((m) => flaggedIdSet.has(m.id)).map((m) => m.id);
  const cleanIds = pending.filter((m) => !flaggedIdSet.has(m.id)).map((m) => m.id);

  for (const [status, ids] of [
    ["flagged", flaggedIds],
    ["clean", cleanIds],
  ] as const) {
    if (!ids.length) continue;

    const { error } = await supabase.rpc("set_live_message_cleanbot_status", {
      p_message_ids: ids,
      p_status: status,
    });

    if (error) {
      console.error(`[moderate-live-messages] ${status} update error:`, error.message);
      return json({ error: error.message }, 500);
    }
  }

  if (flaggedIds.length) {
    console.log("[moderate-live-messages] flagged:", flaggedIds.join(", "));
  }

  return json({ checked: pending.length, flagged: flaggedIds.length });
});
