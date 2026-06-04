// 실시간 통계 화면 검증용 라이브 방송 테스트 데이터를 시드하는 일회성 스크립트입니다.
// 활성 방송 1건 + 후원 5건(wallet_transaction+donation) + 팔로우 4건 + broadcast 카운트 보정.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CREATOR_ID = "de6fad28-820f-4c59-904c-8b51453eb42e";

if (!url || !serviceKey) {
  console.error("환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString();
const fail = (label, error) => {
  if (error) {
    console.error(`✗ ${label}:`, error.message);
    process.exit(1);
  }
};

// 1) 활성 방송 확보 (없으면 RPC로 생성)
let broadcastId;
const existing = await supabase
  .from("live_broadcast")
  .select("id")
  .eq("creator_id", CREATOR_ID)
  .is("ended_at", null)
  .maybeSingle();
fail("기존 활성 방송 조회", existing.error);

if (existing.data) {
  broadcastId = existing.data.id;
  console.log("• 기존 활성 방송 재사용:", broadcastId);
} else {
  const started = await supabase.rpc("start_live_broadcast", {
    p_actor_user_id: CREATOR_ID,
    p_title: "혜진스의 실시간 통계 테스트 방송",
    p_tags: ["게임", "저챗", "테스트"],
  });
  fail("start_live_broadcast", started.error);
  broadcastId = started.data;
  console.log("• 방송 생성:", broadcastId);
}

// 2) 후원 5건: 각 donor의 wallet_transaction(donation_spend) → donation
const donors = [
  { id: "3289323b-5bdb-4fca-91c8-9db043df88ea", amount: 5_000, anon: false, min: 24, msg: "오늘 방송 너무 재밌어요!" },
  { id: "190a658f-80a3-4173-be35-8e9acc976d52", amount: 20_000, anon: false, min: 18, msg: "화이팅!" },
  { id: "9c7aab9f-2e36-4670-a47c-c2137ab548d0", amount: 3_000, anon: true, min: 12, msg: "" },
  { id: "c4fc3a80-5fbf-4d9e-839e-7b43cc8b08eb", amount: 10_000, anon: false, min: 6, msg: "굿굿" },
  { id: "3289323b-5bdb-4fca-91c8-9db043df88ea", amount: 8_000, anon: true, min: 2, msg: "익명 후원이요" },
];
let donationCount = 0;
let donationAmountTotal = 0;
for (const donor of donors) {
  const at = minutesAgo(donor.min);
  const tx = await supabase
    .from("wallet_transaction")
    .insert({
      user_id: donor.id,
      amount_delta: -donor.amount,
      balance_after: 0,
      transaction_type: "donation_spend",
      transaction_status: "succeeded",
      created_at: at,
    })
    .select("id")
    .single();
  fail("wallet_transaction insert", tx.error);

  const donation = await supabase.from("donation").insert({
    broadcast_id: broadcastId,
    creator_id: CREATOR_ID,
    donor_id: donor.id,
    amount: donor.amount,
    is_anonymous: donor.anon,
    message: donor.msg,
    wallet_transaction_id: tx.data.id,
    created_at: at,
  });
  fail("donation insert", donation.error);

  donationCount += 1;
  donationAmountTotal += donor.amount;
}
console.log(`• 후원 ${donationCount}건 / 총 ${donationAmountTotal}P`);

// 3) 팔로우 4건 (최근 30분 내) — 상호작용 로그/팔로우 카드용
const followers = [
  { id: "3289323b-5bdb-4fca-91c8-9db043df88ea", min: 22 },
  { id: "190a658f-80a3-4173-be35-8e9acc976d52", min: 15 },
  { id: "9c7aab9f-2e36-4670-a47c-c2137ab548d0", min: 9 },
  { id: "c4fc3a80-5fbf-4d9e-839e-7b43cc8b08eb", min: 3 },
];
const followRows = followers.map((f) => ({
  creator_id: CREATOR_ID,
  viewer_id: f.id,
  followed_at: minutesAgo(f.min),
}));
const follows = await supabase
  .from("viewer_creator_relation")
  .upsert(followRows, { onConflict: "creator_id,viewer_id" });
fail("viewer_creator_relation upsert", follows.error);
console.log(`• 팔로우 ${followRows.length}건`);

// 4) broadcast 카운트/시작시각 보정 (KPI 카드·차트 시드 소스)
const update = await supabase
  .from("live_broadcast")
  .update({
    started_at: minutesAgo(32),
    current_viewer_count: 342,
    peak_viewer_count: 531,
    chat_message_count: 920,
    donation_count: donationCount,
    donation_amount_total: donationAmountTotal,
  })
  .eq("id", broadcastId);
fail("live_broadcast update", update.error);
console.log("• broadcast 카운트 보정 완료");

console.log("\n✓ 시드 완료. broadcastId =", broadcastId);
