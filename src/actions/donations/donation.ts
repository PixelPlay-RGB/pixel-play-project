"use server";
// 지갑 잔액 등 후원 관련 조회 RPC를 서버에서 호출하는 액션입니다.
// get_user_donation_snapshot은 service_role 전용 SECURITY DEFINER이고 내부에서 auth.uid()를
// 검증하지 않으므로, 반드시 서버에서 인증 actor를 주입해 호출한다(클라 직접 호출 시 권한거부·IDOR).

import { createWriteClientForAction } from "@/actions/common/admin-client-action";
import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { AppActionResult } from "@/types/common/action";
import { isRecord } from "@/utils/common/json";

function extractWalletBalance(data: unknown): number {
  if (!isRecord(data)) return 0;
  const wallet = data.wallet;
  if (!isRecord(wallet)) return 0;
  const balance = wallet.balanceAmount;
  return typeof balance === "number" ? balance : 0;
}

export async function getUserWalletBalanceAction(): Promise<
  AppActionResult<{ balanceAmount: number }>
> {
  const actor = await getAuthenticatedActorId({
    logLabel: "지갑 잔액 조회 중 인증 사용자 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const client = await createWriteClientForAction<{ balanceAmount: number }>(
    "지갑 잔액 조회 Admin Client 생성 실패",
  );

  if (!client.success) {
    return client.result;
  }

  const { data, error } = await client.supabase.rpc("get_user_donation_snapshot", {
    p_actor_user_id: actor.userId,
  });

  if (error) {
    console.error("지갑 잔액 조회 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  return { success: true, data: { balanceAmount: extractWalletBalance(data) } };
}
