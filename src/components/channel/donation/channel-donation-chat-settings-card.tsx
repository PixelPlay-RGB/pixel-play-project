"use client";
// 채팅 후원 설정 카드 — 후원 수신 여부, 금액 표시, 최소 금액을 관리합니다.

import { ChevronDown, ChevronUp } from "lucide-react";
import { Controller, useWatch, type Control, type FieldErrors } from "react-hook-form";

import { SettingFieldRow } from "@/components/common/setting-field-row";
import { SettingToggleControl } from "@/components/common/setting-toggle-control";
import { SettingsCard } from "@/components/common/settings-card";
import { FieldError } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { DONATION_MIN_AMOUNT_FLOOR, DONATION_MIN_AMOUNT_STEP } from "@/constants/channel/donation";
import type { ChannelDonationSettingsInput } from "@/lib/zod/channel-donation";

interface Props {
  control: Control<ChannelDonationSettingsInput>;
  errors: FieldErrors<ChannelDonationSettingsInput>;
  isSaving: boolean;
}

export function ChannelDonationChatSettingsCard({ control, errors, isSaving }: Props) {
  const donationEnabled = useWatch({ control, name: "donationEnabled" });

  return (
    <SettingsCard
      title="채팅 후원 설정"
      description="시청자가 라이브 채팅에서 보낼 수 있는 후원의 기본 조건이에요."
    >
      <Controller
        name="donationEnabled"
        control={control}
        render={({ field }) => (
          <SettingFieldRow
            label="후원 받기"
            description="끄면 시청자가 채팅에서 후원을 보낼 수 없어요."
          >
            <SettingToggleControl
              checked={field.value}
              checkedLabel="ON"
              uncheckedLabel="OFF"
              ariaLabel="채팅 후원 받기"
              disabled={isSaving}
              onChange={field.onChange}
            />
          </SettingFieldRow>
        )}
      />
      <Controller
        name="donationAmountVisible"
        control={control}
        render={({ field }) => (
          <SettingFieldRow
            label="후원 금액 표시"
            description="채팅·알림에 금액 표시"
            isDimmed={!donationEnabled}
          >
            <SettingToggleControl
              checked={field.value}
              checkedLabel="ON"
              uncheckedLabel="OFF"
              ariaLabel="후원 금액 표시"
              disabled={isSaving || !donationEnabled}
              onChange={field.onChange}
            />
          </SettingFieldRow>
        )}
      />
      <Controller
        name="donationMinAmount"
        control={control}
        render={({ field }) => (
          <SettingFieldRow
            label="최소 후원 금액"
            description="이 금액(포인트) 이상부터 후원을 받아요."
            isDimmed={!donationEnabled}
          >
            <div className="flex w-full flex-col gap-1 sm:w-44">
              <InputGroup>
                <InputGroupInput
                  type="number"
                  inputMode="numeric"
                  min={DONATION_MIN_AMOUNT_FLOOR}
                  step={DONATION_MIN_AMOUNT_STEP}
                  value={field.value}
                  disabled={isSaving || !donationEnabled}
                  aria-label="최소 후원 금액"
                  onChange={(event) => field.onChange(event.target.valueAsNumber || 0)}
                  className="[appearance:textfield] text-right [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <InputGroupAddon align="inline-end" className="gap-1.5">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="금액 올리기"
                      disabled={isSaving || !donationEnabled}
                      onClick={() => field.onChange((field.value || 0) + DONATION_MIN_AMOUNT_STEP)}
                      className="text-muted-foreground hover:text-brand hover:bg-muted flex h-3.5 w-4 items-center justify-center rounded-sm transition-colors disabled:opacity-30"
                    >
                      <ChevronUp className="size-3" />
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="금액 내리기"
                      disabled={
                        isSaving ||
                        !donationEnabled ||
                        (field.value || 0) <= DONATION_MIN_AMOUNT_FLOOR
                      }
                      onClick={() =>
                        field.onChange(
                          Math.max(
                            (field.value || 0) - DONATION_MIN_AMOUNT_STEP,
                            DONATION_MIN_AMOUNT_FLOOR,
                          ),
                        )
                      }
                      className="text-muted-foreground hover:text-brand hover:bg-muted flex h-3.5 w-4 items-center justify-center rounded-sm transition-colors disabled:opacity-30"
                    >
                      <ChevronDown className="size-3" />
                    </button>
                  </div>
                  P
                </InputGroupAddon>
              </InputGroup>
              <FieldError errors={[errors.donationMinAmount]} />
            </div>
          </SettingFieldRow>
        )}
      />
    </SettingsCard>
  );
}
