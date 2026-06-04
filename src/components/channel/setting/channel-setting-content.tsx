"use client";
// 채널 관리: 공개 프로필(사진·닉네임) + 채널 소개(bio) 배치 저장 + 홈 배너 즉시 CRUD.

import { Controller } from "react-hook-form";
import { UserStar } from "lucide-react";

import { ChannelBannerField } from "@/components/channel/setting/channel-banner-field";
import { ChannelBioField } from "@/components/channel/setting/channel-bio-field";
import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { StickySaveBar } from "@/components/common/sticky-save-bar";
import ProfileAvatarUpload from "@/components/setting/profile/profile-avatar-upload";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useChannelSettingForm } from "@/hooks/channel/use-channel-setting-form";
import { useStickyActionBar } from "@/hooks/common/use-sticky-action-bar";
import { cn } from "@/lib/utils";
import type { ChannelBanner, ChannelProfile } from "@/types/channel/channel";

interface Props {
  profile: ChannelProfile;
  banners: ChannelBanner[];
}

export function ChannelSettingContent({ profile, banners }: Props) {
  const {
    control,
    errors,
    isSaving,
    isBusy,
    canSubmit,
    nicknameValue,
    nicknameChanged,
    nicknameAvailability,
    handleFileChange,
    handleReset,
    submit,
  } = useChannelSettingForm(profile.bio ?? "");

  const { sentinelRef, show } = useStickyActionBar(canSubmit);

  return (
    <SettingsPage
      kicker="채널 관리"
      title="내 채널을 꾸며요"
      description="공개 프로필과 채널 소개, 홈 배너를 설정해 방문자에게 보여줄 채널을 완성해요."
      action={
        <Button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className={cn(
            "h-11 shrink-0 rounded-xl px-7 font-bold",
            "bg-brand hover:bg-brand/90 text-white",
            "shadow-brand/20 shadow-sm transition-all active:scale-95",
          )}
        >
          {isSaving ? <Spinner /> : "변경사항 저장"}
        </Button>
      }
    >
      <div ref={sentinelRef} aria-hidden />

      <form onSubmit={submit} className="flex min-w-0 flex-col gap-5">
        <SettingsCard
          title="공개 프로필"
          description="채널에 보여지는 프로필 사진과 닉네임이에요."
          contentClassName="gap-6"
        >
          <Controller
            name="photoUrl"
            control={control}
            render={({ field: { value } }) => (
              <ProfileAvatarUpload
                photoUrl={value || null}
                nickname={nicknameValue}
                onFileChange={handleFileChange}
                disabled={isSaving}
              />
            )}
          />

          <div className="flex flex-col gap-2">
            <Label htmlFor="channel-nickname">닉네임</Label>
            <InputGroup
              className={cn(
                nicknameAvailability.nicknameStatus === "available" &&
                  nicknameChanged &&
                  "border-brand ring-brand/20 ring-3",
                (nicknameAvailability.nicknameStatus === "taken" || errors.nickname) &&
                  "border-destructive",
              )}
            >
              <InputGroupAddon align="inline-start">
                <UserStar className="text-muted-foreground size-4" />
              </InputGroupAddon>
              <Controller
                name="nickname"
                control={control}
                render={({ field }) => (
                  <InputGroupInput
                    {...field}
                    id="channel-nickname"
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      nicknameAvailability.syncNicknameStatus(e.target.value);
                    }}
                    disabled={isBusy}
                  />
                )}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  variant="outline"
                  onClick={() => nicknameAvailability.checkNickname()}
                  disabled={isBusy || !!errors.nickname || !nicknameChanged}
                  className="text-brand border-brand/40"
                >
                  {nicknameAvailability.isCheckingNickname ? (
                    <Spinner />
                  ) : nicknameAvailability.nicknameStatus === "available" && nicknameChanged ? (
                    "사용가능"
                  ) : !nicknameChanged ? (
                    "사용 중"
                  ) : (
                    "중복확인"
                  )}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {nicknameAvailability.nicknameStatus === "available" && nicknameChanged && (
              <p className="text-brand text-xs">사용 가능한 닉네임입니다.</p>
            )}
            {nicknameAvailability.nicknameStatus === "taken" && (
              <p className="text-destructive text-xs">이미 사용 중인 닉네임입니다.</p>
            )}
            <FieldError errors={[errors.nickname]} />
          </div>
        </SettingsCard>

        <SettingsCard title="채널 소개" description="방문자에게 보여줄 채널 소개글이에요.">
          <Controller
            name="bio"
            control={control}
            render={({ field }) => (
              <ChannelBioField value={field.value} disabled={isSaving} onChange={field.onChange} />
            )}
          />
        </SettingsCard>
      </form>

      <SettingsCard
        title="홈 배너"
        description="채널 홈 상단에 노출되는 외부 링크 배너를 관리해요."
      >
        <ChannelBannerField initialBanners={banners} />
      </SettingsCard>

      <StickySaveBar
        show={show}
        isSaving={isSaving}
        canSave={canSubmit}
        onSave={submit}
        onReset={handleReset}
      />
    </SettingsPage>
  );
}
