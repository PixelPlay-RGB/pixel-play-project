// Toss Payments 승인 결과를 검증하고 후원금 잔액에 반영하는 API 라우트입니다.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "Toss 결제 승인 API입니다." }, { status: 501 });
}
