// 사용자 후원 지갑 화면의 필터 URL을 생성합니다.
import type {
  UserDonationFilter,
  UserDonationPeriod,
  UserDonationTab,
  UserDonationUsageKind,
} from "@/types/donations/user-donations";

export function buildUserDonationHref(
  filter: UserDonationFilter,
  overrides: Partial<{
    tab: UserDonationTab;
    usageKind: UserDonationUsageKind;
    period: Partial<UserDonationPeriod>;
  }>,
) {
  const nextTab = overrides.tab ?? filter.tab;
  const nextUsageKind = overrides.usageKind ?? filter.usageKind;
  const nextPeriod = {
    ...filter.period,
    ...overrides.period,
  };
  const params = new URLSearchParams({
    tab: nextTab,
    year: String(nextPeriod.year),
    month: String(nextPeriod.month),
  });

  if (nextTab === "usage") {
    params.set("kind", nextUsageKind);
  }

  return `/user/donations?${params.toString()}`;
}
