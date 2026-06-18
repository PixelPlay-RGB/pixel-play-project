// Toss Payments 라이브 구독 결제 승인과 결제 상태 반영을 처리합니다.
import "server-only";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { AppMessageCode } from "@/constants/common/app-message-code";
import { CREATOR_SUBSCRIPTION_PAYMENT_AMOUNT } from "@/constants/subscriptions/creator-subscription";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import type { AppActionResult } from "@/types/common/action";
import type { Json } from "@/types/database.types";
import type { CreatorSubscriptionActionResult, CreatorSubscriptionStatus } from "@/types/live/live";
import {
  isCreatorSubscriptionPaymentAmount,
  type TossCreatorSubscriptionPrepareResponse,
} from "@/utils/payments/toss-creator-subscription-order";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";
import {
  shouldMarkTossConfirmFailed,
  TOSS_CONFIRM_TIMEOUT_MS,
} from "@/utils/payments/toss-confirm-failure-policy";

type CreatorSubscriptionPaymentStatus = "pending" | "succeeded" | "failed" | "canceled";

interface CreatorSubscriptionPaymentRow {
  id: string;
  creator_id: string;
  subscriber_id: string;
  subscription_id: string | null;
  payment_status: CreatorSubscriptionPaymentStatus;
  amount: number;
  order_id: string;
  payment_key: string | null;
  idempotency_key: string;
  metadata: Json;
}

interface TossPaymentConfirmInput {
  creatorId?: unknown;
  paymentKey?: unknown;
  orderId?: unknown;
  amount?: unknown;
}

interface TossPaymentFailureInput {
  orderId?: unknown;
  code?: unknown;
  message?: unknown;
  status: Extract<CreatorSubscriptionPaymentStatus, "failed" | "canceled">;
}

interface TossCreatorSubscriptionConfirmResponse {
  orderId: string;
  amount: number;
  paymentKey: string;
  subscription: CreatorSubscriptionActionResult | null;
  replayed: boolean;
}

type TossCreatorSubscriptionConfirmResult =
  | (AppActionResult<TossCreatorSubscriptionConfirmResponse> & { success: true; status: 200 })
  | (AppActionResult & { success: false; code: AppMessageCode; status: number });

const TOSS_PAYMENTS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";
const CREATOR_SUBSCRIPTION_PAYMENT_SELECT =
  "id,creator_id,subscriber_id,subscription_id,payment_status,amount,order_id,payment_key,idempotency_key,metadata";

const CREATOR_SUBSCRIPTION_STATUSES: readonly CreatorSubscriptionStatus[] = [
  "active",
  "expired",
  "canceled",
];

export async function confirmTossCreatorSubscriptionPayment(
  input: TossPaymentConfirmInput,
): Promise<TossCreatorSubscriptionConfirmResult> {
  const parsedInput = parseTossPaymentConfirmInput(input);

  if (!parsedInput) {
    return createConfirmFailure(APP_MESSAGE_CODE.error.live.subscriptionFailed, 400);
  }

  if (!isCreatorSubscriptionPaymentAmount(parsedInput.amount)) {
    return createConfirmFailure(APP_MESSAGE_CODE.error.live.subscriptionFailed, 400);
  }

  const userResult = await getAuthenticatedUserId();

  if (!userResult.success) {
    return createConfirmFailure(userResult.code, userResult.status);
  }

  const pendingResult = await getSubscriptionPaymentByOrderId(
    parsedInput.orderId,
    userResult.userId,
    parsedInput.creatorId,
  );

  if (!pendingResult.success) {
    return createConfirmFailure(pendingResult.code, pendingResult.status);
  }

  const subscriptionPayment = pendingResult.subscriptionPayment;
  const replayedResult = getReplayConfirmedSubscriptionPayment(subscriptionPayment, parsedInput);

  if (replayedResult) {
    return {
      success: true,
      status: 200,
      data: replayedResult,
    };
  }

  if (subscriptionPayment.payment_status !== "pending") {
    return createConfirmFailure(APP_MESSAGE_CODE.error.live.subscriptionFailed, 409);
  }

  if (subscriptionPayment.amount !== parsedInput.amount) {
    return createConfirmFailure(APP_MESSAGE_CODE.error.live.subscriptionFailed, 400);
  }

  const tossConfirmResult = await requestTossPaymentConfirm(
    parsedInput,
    subscriptionPayment.idempotency_key,
  );

  if (!tossConfirmResult.success) {
    if (tossConfirmResult.shouldMarkFailed) {
      await markSubscriptionPaymentStatus(
        subscriptionPayment,
        "failed",
        "TOSS_CONFIRM_FAILED",
        null,
      );
    }

    return createConfirmFailure(
      APP_MESSAGE_CODE.error.live.subscriptionFailed,
      tossConfirmResult.status,
    );
  }

  const subscriptionResult = await activateCreatorSubscription(
    userResult.userId,
    subscriptionPayment.creator_id,
  );

  if (!subscriptionResult.success) {
    return createConfirmFailure(subscriptionResult.code, subscriptionResult.status);
  }

  const paymentSucceeded = await markSubscriptionPaymentSucceeded(
    subscriptionPayment,
    parsedInput,
    subscriptionResult.subscription,
    tossConfirmResult.data,
  );

  if (!paymentSucceeded) {
    return createConfirmFailure(APP_MESSAGE_CODE.error.live.subscriptionFailed, 500);
  }

  return {
    success: true,
    status: 200,
    data: {
      orderId: parsedInput.orderId,
      amount: parsedInput.amount,
      paymentKey: parsedInput.paymentKey,
      subscription: subscriptionResult.subscription,
      replayed: false,
    },
  };
}

export async function markTossCreatorSubscriptionPaymentFailure(input: TossPaymentFailureInput) {
  const orderId = readText(input.orderId);

  if (!orderId) {
    return;
  }

  const userResult = await getAuthenticatedUserId();

  if (!userResult.success) {
    return;
  }

  const pendingResult = await getSubscriptionPaymentByOrderId(orderId, userResult.userId);

  if (!pendingResult.success || pendingResult.subscriptionPayment.payment_status !== "pending") {
    return;
  }

  await markSubscriptionPaymentStatus(
    pendingResult.subscriptionPayment,
    input.status,
    readText(input.code),
    readText(input.message),
  );
}

export function buildTossCreatorSubscriptionPrepareResponse(
  orderId: string,
  orderName: string,
  customerKey: string,
): TossCreatorSubscriptionPrepareResponse {
  return {
    orderId,
    orderName,
    amount: CREATOR_SUBSCRIPTION_PAYMENT_AMOUNT,
    customerKey,
  };
}

async function getAuthenticatedUserId() {
  const serverClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await serverClient.auth.getUser();

  if (userError && !isAuthSessionMissingError(userError)) {
    console.error("Toss 구독 결제 처리 중 인증 사용자 조회 실패", userError);
  }

  if (!user) {
    return {
      success: false as const,
      code: APP_MESSAGE_CODE.error.auth.authInfoNotFound,
      status: 401,
    };
  }

  return {
    success: true as const,
    userId: user.id,
  };
}

async function getSubscriptionPaymentByOrderId(
  orderId: string,
  userId: string,
  creatorId?: string,
) {
  const supabase = createAdminClient();
  let query = supabase
    .from("creator_subscription_payment")
    .select(CREATOR_SUBSCRIPTION_PAYMENT_SELECT)
    .eq("order_id", orderId)
    .eq("subscriber_id", userId);

  if (creatorId) {
    query = query.eq("creator_id", creatorId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Toss 구독 결제 승인 대상 주문 조회 실패", error);
    return {
      success: false as const,
      code: APP_MESSAGE_CODE.error.live.subscriptionFailed,
      status: 500,
    };
  }

  if (!data) {
    return {
      success: false as const,
      code: APP_MESSAGE_CODE.error.live.subscriptionFailed,
      status: 404,
    };
  }

  return {
    success: true as const,
    subscriptionPayment: data as CreatorSubscriptionPaymentRow,
  };
}

async function requestTossPaymentConfirm(
  input: {
    amount: number;
    orderId: string;
    paymentKey: string;
  },
  idempotencyKey: string,
) {
  const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;

  if (!secretKey) {
    console.error("TOSS_PAYMENTS_SECRET_KEY가 설정되지 않았습니다.");
    return {
      success: false as const,
      status: 500,
      shouldMarkFailed: false,
    };
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), TOSS_CONFIRM_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(TOSS_PAYMENTS_CONFIRM_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        paymentKey: input.paymentKey,
        orderId: input.orderId,
        amount: input.amount,
      }),
      cache: "no-store",
      signal: abortController.signal,
    });
  } catch (error: unknown) {
    const isTimeout = isAbortError(error);
    const status = isTimeout ? 504 : 502;
    console.error("Toss 구독 결제 승인 API 네트워크 호출 실패", {
      error,
      isTimeout,
      status,
    });
    return {
      success: false as const,
      status,
      shouldMarkFailed: false,
    };
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await readJsonResponse(response);

  if (!response.ok) {
    const tossErrorCode = readObjectText(data, "code");
    const shouldMarkFailed = shouldMarkTossConfirmFailed({
      status: response.status,
      errorCode: tossErrorCode,
    });

    console.error("Toss 구독 결제 승인 API 호출 실패", {
      status: response.status,
      tossErrorCode,
      shouldMarkFailed,
      data,
    });
    return {
      success: false as const,
      status: response.status,
      shouldMarkFailed,
    };
  }

  return {
    success: true as const,
    data,
  };
}

async function activateCreatorSubscription(userId: string, creatorId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("subscribe_creator", {
    p_actor_user_id: userId,
    p_creator_id: creatorId,
  });

  if (error) {
    console.error("Toss 구독 결제 후 구독 활성화 실패", error);
    return {
      success: false as const,
      code: APP_MESSAGE_CODE.error.live.subscriptionFailed,
      status: 500,
    };
  }

  const subscription = normalizeCreatorSubscriptionResult(data);

  if (!subscription) {
    console.error("Toss 구독 결제 후 구독 활성화 응답 형식 오류", data);
    return {
      success: false as const,
      code: APP_MESSAGE_CODE.error.live.subscriptionFailed,
      status: 500,
    };
  }

  return {
    success: true as const,
    subscription,
  };
}

async function markSubscriptionPaymentSucceeded(
  subscriptionPayment: CreatorSubscriptionPaymentRow,
  input: {
    amount: number;
    orderId: string;
    paymentKey: string;
  },
  subscription: CreatorSubscriptionActionResult,
  tossPayment: unknown,
) {
  const supabase = createAdminClient();
  const approvedAt = readObjectText(tossPayment, "approvedAt") ?? new Date().toISOString();
  const metadata: Json = {
    ...readJsonObject(subscriptionPayment.metadata),
    paymentProvider: "toss",
    paymentType: "creator_subscription",
    tossOrderId: input.orderId,
    tossPaymentKey: input.paymentKey,
    tossMethod: readObjectText(tossPayment, "method"),
    tossStatus: readObjectText(tossPayment, "status"),
    approvedAt,
    confirmedAt: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("creator_subscription_payment")
    .update({
      payment_status: "succeeded",
      payment_key: input.paymentKey,
      subscription_id: subscription.id,
      approved_at: approvedAt,
      metadata,
    })
    .eq("id", subscriptionPayment.id)
    .eq("payment_status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Toss 구독 결제 성공 상태 저장 실패", error);
    return false;
  }

  if (!data) {
    console.error("Toss 구독 결제 성공 상태 저장 대상 없음", {
      orderId: subscriptionPayment.order_id,
      subscriptionPaymentId: subscriptionPayment.id,
    });
    return false;
  }

  return true;
}

async function markSubscriptionPaymentStatus(
  subscriptionPayment: CreatorSubscriptionPaymentRow,
  status: Extract<CreatorSubscriptionPaymentStatus, "failed" | "canceled">,
  code: string,
  message: string | null,
) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const metadata: Json = {
    ...readJsonObject(subscriptionPayment.metadata),
    paymentProvider: "toss",
    paymentType: "creator_subscription",
    tossFailureCode: code || null,
    tossFailureMessage: message || null,
    failedAt: status === "failed" ? now : null,
    canceledAt: status === "canceled" ? now : null,
  };
  const { error } = await supabase
    .from("creator_subscription_payment")
    .update({
      payment_status: status,
      failure_code: code || null,
      failure_message: message,
      failed_at: status === "failed" ? now : null,
      canceled_at: status === "canceled" ? now : null,
      metadata,
    })
    .eq("id", subscriptionPayment.id)
    .eq("payment_status", "pending");

  if (error) {
    console.error("Toss 구독 결제 실패 상태 저장 실패", error);
  }
}

function parseTossPaymentConfirmInput(input: TossPaymentConfirmInput) {
  const creatorId = readText(input.creatorId);
  const paymentKey = readText(input.paymentKey);
  const orderId = readText(input.orderId);
  const amount = readAmount(input.amount);

  if (!creatorId || !paymentKey || !orderId || !Number.isFinite(amount)) {
    return null;
  }

  return {
    creatorId,
    paymentKey,
    orderId,
    amount,
  };
}

function getReplayConfirmedSubscriptionPayment(
  subscriptionPayment: CreatorSubscriptionPaymentRow,
  input: { paymentKey: string; orderId: string; amount: number },
): TossCreatorSubscriptionConfirmResponse | null {
  if (subscriptionPayment.payment_status !== "succeeded") {
    return null;
  }

  if (subscriptionPayment.amount !== input.amount) {
    return null;
  }

  if (subscriptionPayment.payment_key && subscriptionPayment.payment_key !== input.paymentKey) {
    return null;
  }

  return {
    orderId: input.orderId,
    amount: input.amount,
    paymentKey: input.paymentKey,
    subscription: null,
    replayed: true,
  };
}

function normalizeCreatorSubscriptionResult(data: unknown): CreatorSubscriptionActionResult | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const item = data as Record<string, unknown>;
  const id = item.id;
  const isSubscribed = item.isSubscribed;
  const alreadySubscribed = item.alreadySubscribed;
  const startedAt = item.startedAt;
  const endAt = item.endAt;
  const totalMonths = item.totalMonths;
  const status = item.status;

  if (typeof id !== "string") return null;
  if (typeof isSubscribed !== "boolean") return null;
  if (typeof alreadySubscribed !== "boolean") return null;
  if (typeof startedAt !== "string") return null;
  if (typeof endAt !== "string") return null;
  if (typeof totalMonths !== "number") return null;
  if (!isCreatorSubscriptionStatus(status)) return null;

  return {
    id,
    isSubscribed,
    alreadySubscribed,
    startedAt,
    endAt,
    totalMonths,
    status,
  };
}

function isCreatorSubscriptionStatus(value: unknown): value is CreatorSubscriptionStatus {
  return CREATOR_SUBSCRIPTION_STATUSES.includes(value as CreatorSubscriptionStatus);
}

function readJsonObject(value: Json | undefined): Record<string, Json | undefined> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
}

function readObjectText(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const item = (value as Record<string, unknown>)[key];

  return typeof item === "string" ? item : null;
}

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readAmount(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }

  return NaN;
}

async function readJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isAbortError(error: unknown) {
  return (
    error instanceof DOMException && (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

function createConfirmFailure(code: AppMessageCode, status: number) {
  return {
    success: false as const,
    code,
    status,
  };
}
