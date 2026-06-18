// Toss Payments 라이브 구독 테스트 결제창을 열기 위한 구독 주문을 준비합니다.
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";
import { isUuid } from "@/utils/common/uuid";
import { CREATOR_SUBSCRIPTION_PAYMENT_AMOUNT } from "@/constants/subscriptions/creator-subscription";
import { buildTossCreatorSubscriptionPrepareResponse } from "@/utils/payments/toss-creator-subscription";
import {
  createCreatorSubscriptionOrderId,
  createCreatorSubscriptionOrderName,
} from "@/utils/payments/toss-creator-subscription-order";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

interface PrepareRequestBody {
  creatorId?: unknown;
}

export async function POST(request: Request) {
  const serverClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await serverClient.auth.getUser();

  if (userError && !isAuthSessionMissingError(userError)) {
    console.error("Toss 구독 결제 준비 중 인증 사용자 조회 실패", userError);
  }

  if (!user) {
    return NextResponse.json(
      { code: APP_MESSAGE_CODE.error.auth.authInfoNotFound },
      { status: 401 },
    );
  }

  const creatorId = await readCreatorId(request);

  if (!creatorId || !isUuid(creatorId) || creatorId === user.id) {
    return NextResponse.json(
      { code: APP_MESSAGE_CODE.error.live.subscriptionFailed },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data: creator, error: creatorError } = await supabase
    .from("user")
    .select("id,nickname")
    .eq("id", creatorId)
    .maybeSingle();

  if (creatorError) {
    console.error("Toss 구독 결제 준비 중 방송인 조회 실패", creatorError);
    return NextResponse.json(
      { code: APP_MESSAGE_CODE.error.live.subscriptionFailed },
      { status: 500 },
    );
  }

  if (!creator) {
    return NextResponse.json(
      { code: APP_MESSAGE_CODE.error.live.subscriptionFailed },
      { status: 404 },
    );
  }

  const activeSubscriptionResult = await hasActiveCreatorSubscription(creatorId, user.id);

  if (!activeSubscriptionResult.success) {
    return NextResponse.json(
      { code: APP_MESSAGE_CODE.error.live.subscriptionFailed },
      { status: 500 },
    );
  }

  if (activeSubscriptionResult.alreadyActive) {
    return NextResponse.json(
      { code: APP_MESSAGE_CODE.error.live.subscriptionFailed },
      { status: 409 },
    );
  }

  const orderId = createCreatorSubscriptionOrderId(Date.now(), randomUUID());
  const idempotencyKey = `creator-subscription:${randomUUID()}`;
  const orderName = createCreatorSubscriptionOrderName(creator.nickname);
  const { error: insertError } = await supabase.from("creator_subscription_payment").insert({
    creator_id: creatorId,
    subscriber_id: user.id,
    amount: CREATOR_SUBSCRIPTION_PAYMENT_AMOUNT,
    order_id: orderId,
    idempotency_key: idempotencyKey,
    payment_status: "pending",
    provider: "toss",
    metadata: {
      paymentProvider: "toss",
      paymentType: "creator_subscription",
      preparedAt: new Date().toISOString(),
    },
  });

  if (insertError) {
    console.error("Toss 구독 결제 준비 주문 저장 실패", insertError);
    return NextResponse.json(
      { code: APP_MESSAGE_CODE.error.live.subscriptionFailed },
      { status: 500 },
    );
  }

  return NextResponse.json(
    buildTossCreatorSubscriptionPrepareResponse(orderId, orderName, user.id),
  );
}

async function readCreatorId(request: Request) {
  try {
    const body = (await request.json()) as PrepareRequestBody;

    return typeof body.creatorId === "string" ? body.creatorId.trim() : "";
  } catch {
    return "";
  }
}

async function hasActiveCreatorSubscription(creatorId: string, subscriberId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("creator_subscription")
    .select("id,status,end_at")
    .eq("creator_id", creatorId)
    .eq("subscriber_id", subscriberId)
    .eq("status", "active")
    .gt("end_at", new Date().toISOString())
    .limit(1);

  if (error) {
    console.error("Toss 구독 결제 준비 중 기존 구독 조회 실패", error);
    return { success: false as const };
  }

  return { success: true as const, alreadyActive: (data ?? []).length > 0 };
}
