"use server";
// 채널 정산 내역(연도별 후원/요약) 조회 액션을 처리합니다.

import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import {
  SETTLEMENT_PAGE_SIZE,
  type SettlementSortOption,
  type SettlementStatusFilter,
} from "@/constants/channel/donation";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { SettlementDonationsResult, SettlementYearSummary } from "@/types/channel/donation";
import type { AppActionResult } from "@/types/common/action";
import {
  buildSettlementDonations,
  buildSettlementYearlySummary,
} from "@/utils/channel/channel-donation-snapshot";

const SETTLEMENT_LOAD_FAILED_CODE = APP_MESSAGE_CODE.error.channel.settlementLoadFailed;

interface SettlementDonationsParams {
  year: number;
  status: SettlementStatusFilter;
  sort: SettlementSortOption;
  page: number;
}

export async function getSettlementDonationsAction({
  year,
  status,
  sort,
  page,
}: SettlementDonationsParams): Promise<AppActionResult<SettlementDonationsResult>> {
  const actor = await getAuthenticatedActorId({
    logLabel: "정산 내역 조회 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const offset = Math.max(page - 1, 0) * SETTLEMENT_PAGE_SIZE;
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_creator_settlement_donations", {
    p_actor_user_id: actor.userId,
    p_year: year,
    p_status: status,
    p_sort: sort,
    p_limit: SETTLEMENT_PAGE_SIZE,
    p_offset: offset,
  });

  if (error) {
    console.error("정산 내역 조회 실패", error);
    return { success: false, code: SETTLEMENT_LOAD_FAILED_CODE };
  }

  try {
    return { success: true, data: buildSettlementDonations(data) };
  } catch (error) {
    console.error("정산 내역 표시값 생성 실패", error);
    return { success: false, code: SETTLEMENT_LOAD_FAILED_CODE };
  }
}

export async function getSettlementYearlySummaryAction(): Promise<
  AppActionResult<SettlementYearSummary[]>
> {
  const actor = await getAuthenticatedActorId({
    logLabel: "연도별 정산 요약 조회 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_creator_settlement_yearly_summary", {
    p_actor_user_id: actor.userId,
  });

  if (error) {
    console.error("연도별 정산 요약 조회 실패", error);
    return { success: false, code: SETTLEMENT_LOAD_FAILED_CODE };
  }

  try {
    return { success: true, data: buildSettlementYearlySummary(data) };
  } catch (error) {
    console.error("연도별 정산 요약 표시값 생성 실패", error);
    return { success: false, code: SETTLEMENT_LOAD_FAILED_CODE };
  }
}
