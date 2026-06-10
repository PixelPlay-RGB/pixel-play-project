// Toss Payments 승인 결과를 검증하고 후원 지갑 잔액에 반영하는 API 라우트입니다.
import { confirmTossWalletCharge } from "@/lib/payments/toss-wallet-charge";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const result = await confirmTossWalletCharge(await readRequestBody(request));

  if (!result.success) {
    return NextResponse.json({ code: result.code }, { status: result.status });
  }

  return NextResponse.json(result.data);
}

async function readRequestBody(request: Request) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return {};
    }

    const record = body as Record<string, unknown>;

    return {
      amount: record.amount,
      orderId: record.orderId,
      paymentKey: record.paymentKey,
    };
  } catch {
    return {};
  }
}
