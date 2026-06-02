"use client";
// 사용자 후원 지갑 화면의 연도와 월 필터를 변경합니다.

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectLabel,
  SelectList,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserDonationFilter } from "@/types/donations/user-donations";
import { buildUserDonationHref } from "@/utils/donations/user-donation-url";
import { useRouter } from "next/navigation";

interface Props {
  filter: UserDonationFilter;
}

export function UserDonationPeriodFilter({ filter }: Props) {
  const router = useRouter();
  const currentYear = Math.max(new Date().getFullYear(), filter.period.year);
  const yearOptions = Array.from({ length: currentYear - 2019 }, (_, index) => currentYear - index);
  const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);

  const handleYearChange = (value: string | null) => {
    if (!value) {
      return;
    }

    router.push(buildUserDonationHref(filter, { period: { year: Number(value) } }));
  };

  const handleMonthChange = (value: string | null) => {
    if (!value) {
      return;
    }

    router.push(buildUserDonationHref(filter, { period: { month: Number(value) } }));
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
      <Select
        value={String(filter.period.year)}
        items={yearOptions.map((year) => ({ label: `${year}년`, value: String(year) }))}
        onValueChange={handleYearChange}
      >
        <SelectTrigger aria-label="연도 선택" className="min-w-0 sm:w-25">
          <SelectValue placeholder={`${filter.period.year}년`} />
          <SelectIcon />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>연도</SelectLabel>
            <SelectList>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={String(year)} label={`${year}년`}>
                  {year}년
                </SelectItem>
              ))}
            </SelectList>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={String(filter.period.month)}
        items={monthOptions.map((month) => ({ label: `${month}월`, value: String(month) }))}
        onValueChange={handleMonthChange}
      >
        <SelectTrigger aria-label="월 선택" className="min-w-0 sm:w-25">
          <SelectValue placeholder={`${filter.period.month}월`} />
          <SelectIcon />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>월</SelectLabel>
            <SelectList>
              {monthOptions.map((month) => (
                <SelectItem key={month} value={String(month)} label={`${month}월`}>
                  {month}월
                </SelectItem>
              ))}
            </SelectList>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
