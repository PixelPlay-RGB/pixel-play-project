"use client";
// 채널 관리: 공개 프로필(사진·닉네임) + 채널 소개(bio) + 홈 배너(추가/삭제는 즉시, 순서는 저장 시 커밋).
// 하나의 Card 안에서 섹션(공개 프로필 / 채널 소개 / 홈 배너)으로만 구분한다.

import { Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { UserStar } from "lucide-react";
import type { ReactNode } from "react";

import { ChannelBannerField } from "@/components/channel/setting/channel-banner-field";
import { ChannelBioField } from "@/components/channel/setting/channel-bio-field";
import { SettingsPage } from "@/components/common/settings-page";
import { StickySaveBar } from "@/components/common/sticky-save-bar";
import ProfileAvatarUpload from "@/components/setting/profile/profile-avatar-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useChannelBanners } from "@/hooks/channel/use-channel-banners";
import { useChannelSettingForm } from "@/hooks/channel/use-channel-setting-form";
import { useStickyActionBar } from "@/hooks/common/use-sticky-action-bar";
import { cn } from "@/lib/utils";
import type { ChannelBanner, ChannelProfile } from "@/types/channel/channel";

interface Props {
  profile: ChannelProfile;
  banners: ChannelBanner[];
}

function SettingSection({
  title,
  description,
  withDivider,
  children,
}: {
  title: string;
  description?: string;
  withDivider?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={cn("flex flex-col gap-5 p-5 sm:p-6", withDivider && "border-border/60 border-t")}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-foreground text-base font-bold">{title}</h2>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function ChannelSettingContent({ profile, banners }: Props) {
  const router = useRouter();
  const form = useChannelSettingForm(profile.bio ?? "");
  const bannerController = useChannelBanners(banners);

  const {
    control,
    errors,
    isDirty: isFormDirty,
    canSave: canSaveForm,
    isSaving: isFormSaving,
    isBusy,
    nicknameValue,
    nicknameChanged,
    nicknameAvailability,
    handleFileChange,
    handleReset,
    runSave,
  } = form;

  const isDirty = isFormDirty || bannerController.isOrderDirty;
  const isSaving = isFormSaving || bannerController.isCommittingOrder;
  const canSubmit = isDirty && canSaveForm && !isBusy && !bannerController.isCommittingOrder;

  const { sentinelRef, show } = useStickyActionBar(canSubmit);

  // 배너 순서 커밋 → 프로필/소개 저장(둘 다 dirty일 때만). 한 번의 "변경사항 저장"으로 처리.
  const handleSave = async () => {
    if (!canSubmit) return;

    if (bannerController.isOrderDirty) {
      const ok = await bannerController.commitOrder();
      if (!ok) return;
    }
    if (isFormDirty) {
      await runSave();
    }
  };

  const handleResetAll = () => {
    handleReset();
    bannerController.resetOrder();
  };

  return (
    <SettingsPage
      kicker="채널 관리"
      title="내 채널을 꾸며요"
      description="공개 프로필과 채널 소개, 홈 배너를 설정해 방문자에게 보여줄 채널을 완성해요."
      action={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
            className="h-11 shrink-0 rounded-xl px-5 font-bold"
          >
            돌아가기
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canSubmit}
            className={cn(
              "h-11 shrink-0 rounded-xl px-7 font-bold",
              "bg-brand hover:bg-brand/90 text-brand-foreground",
              "shadow-brand/20 shadow-sm transition-all active:scale-95",
            )}
          >
            {isSaving ? <Spinner /> : "변경사항 저장"}
          </Button>
        </div>
      }
    >
      <div ref={sentinelRef} aria-hidden />

      <Card className="gap-0 py-0 shadow-sm">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
          className="flex flex-col"
        >
          <SettingSection
            title="공개 프로필"
            description="채널에 보여지는 프로필 사진과 닉네임이에요."
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
                      disabled={isBusy || bannerController.isCommittingOrder}
                    />
                  )}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    variant="outline"
                    onClick={() => nicknameAvailability.checkNickname()}
                    disabled={
                      isBusy ||
                      bannerController.isCommittingOrder ||
                      !!errors.nickname ||
                      !nicknameChanged
                    }
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
          </SettingSection>

          <SettingSection
            title="채널 소개"
            description="방문자에게 보여줄 채널 소개글이에요."
            withDivider
          >
            <Controller
              name="bio"
              control={control}
              render={({ field }) => (
                <ChannelBioField
                  value={field.value}
                  disabled={isSaving}
                  onChange={field.onChange}
                />
              )}
            />
          </SettingSection>
        </form>

        <SettingSection
          title="홈 배너"
          description="채널 홈 상단에 노출되는 외부 링크 배너를 관리해요. 순서 변경은 저장해야 반영돼요."
          withDivider
        >
          <ChannelBannerField controller={bannerController} />
        </SettingSection>
      </Card>

      <StickySaveBar
        show={show}
        isSaving={isSaving}
        canSave={canSubmit}
        onSave={() => void handleSave()}
        onReset={handleResetAll}
      />
    </SettingsPage>
  );
}
