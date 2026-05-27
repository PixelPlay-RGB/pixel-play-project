// Toss Payments 결제 이벤트를 보정 처리하는 웹훅 API 라우트입니다.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "Toss 결제 웹훅 API입니다." }, { status: 501 });
}
