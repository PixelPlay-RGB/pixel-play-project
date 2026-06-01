// Toss 결제창을 열기 전 충전 주문 정보를 준비하는 API 라우트입니다.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "Toss 결제 준비 API입니다." }, { status: 501 });
}
