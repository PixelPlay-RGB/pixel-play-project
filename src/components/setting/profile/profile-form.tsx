"use client";
// 프로필 설정 화면 — 폼 훅과 공개 프로필·계정 정보 카드를 조합합니다.

import { Lock, Mail, UserRound, UserStar } from "lucide-react";
import { Controller } from "react-hook-form";

import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { SideTipCard, SideTipStep } from "@/components/common/side-tip-card";
import { StickySaveBar } from "@/components/common/sticky-save-bar";
import ProfileAvatarUpload from "@/components/setting/profile/profile-avatar-upload";
import ProfileProvidersCard from "@/components/setting/profile/profile-providers-card";
import ProfileFormSkeleton from "@/components/setting/profile/profile-form-skeleton";
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
import { resolveProfileQueryErrorCode } from "@/hooks/profile/use-profile";
import { useProfileForm } from "@/hooks/profile/use-profile-form";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/common/format";
import { getAppMessage } from "@/utils/common/app-message";

const PROFILE_PAGE_HEADER = {
  kicker: "내 계정",
  title: "프로필을 관리해요",
  description: "공개 프로필과 계정 정보를 확인하고, 연동된 로그인 수단을 관리할 수 있어요.",
} as const;

export default function ProfileForm() {
  const {
    canSubmit,
    control,
    errors,
    handleCheckNickname,
    handleFileChange,
    handleReset,
    isBusy,
    isLoading,
    isSaving,
    isUserError,
    nicknameAvailability,
    nicknameChanged,
    nicknameValue,
    sentinelRef,
    show,
    submitForm,
    user,
    userError,
  } = useProfileForm();

  const headerAction = user ? (
    <Button
      type="button"
      onClick={submitForm}
      disabled={!canSubmit}
      className={cn(
        "h-11 shrink-0 rounded-xl px-7 font-bold lg:w-auto",
        "bg-brand hover:bg-brand/90 text-brand-foreground",
        "shadow-brand/20 shadow-sm transition-all active:scale-95",
      )}
    >
      {isSaving ? <Spinner /> : "변경사항 저장"}
    </Button>
  ) : null;

  return (
    <SettingsPage {...PROFILE_PAGE_HEADER} action={headerAction}>
      <div ref={sentinelRef} aria-hidden />

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-5">{renderBody()}</div>

        <div className="flex flex-col gap-5 xl:w-120 xl:shrink-0">
          <ProfileProvidersCard />

          <SideTipCard
            icon={<UserRound className="size-5" />}
            title="프로필을 관리하기 전에 확인해요"
            description={`공개 프로필은 다른 사용자에게 그대로 보여져요.\n닉네임과 사진은 언제든 바꿀 수 있어요.`}
          >
            <SideTipStep
              number="1"
              title="닉네임을 정해요"
              description={`닉네임은 다른 사용자와 중복될 수 없어요.\n변경한 뒤 중복확인을 눌러 사용 가능한지 확인해주세요.`}
            />
            <SideTipStep
              number="2"
              title="프로필 사진을 올려요"
              description={`정사각형 비율을 권장해요.\n최대 5MB까지 JPG, PNG, WEBP 형식으로 올릴 수 있어요.`}
            />
            <SideTipStep
              number="3"
              title="로그인 수단을 관리해요"
              description={`로그인 수단은 최소 1개를 유지해야 해요.\n마지막 1개는 연결을 해제할 수 없어요.`}
            />
          </SideTipCard>
        </div>
      </div>

      {user && (
        <StickySaveBar
          show={show}
          isSaving={isSaving}
          canSave={canSubmit}
          onSave={submitForm}
          onReset={handleReset}
        />
      )}
    </SettingsPage>
  );

  function renderBody() {
    if (isUserError) {
      const message = getAppMessage(resolveProfileQueryErrorCode(userError));

      return (
        <SettingsCard title={message.title}>
          <p className="text-muted-foreground text-sm">{message.description}</p>
        </SettingsCard>
      );
    }

    if (isLoading || !user) {
      return <ProfileFormSkeleton />;
    }

    return (
      <form onSubmit={submitForm} className="flex w-full flex-col gap-5">
        <SettingsCard
          title="공개 프로필"
          description="다른 사용자에게 보여지는 프로필이에요."
          contentClassName="gap-6"
        >
          <Controller
            name={"photoUrl"}
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
            <Label htmlFor="profile-nickname">닉네임</Label>
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
                    id="profile-nickname"
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
                  onClick={handleCheckNickname}
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

        <SettingsCard title="계정 정보" description="로그인과 가입에 사용된 정보예요.">
          <div className="flex flex-col gap-2">
            <Label>이메일</Label>
            <InputGroup className="opacity-75">
              <InputGroupAddon align="inline-start">
                <Mail className="size-4" />
              </InputGroupAddon>
              <InputGroupInput value={user.email} disabled readOnly />
              <InputGroupAddon align="inline-end">
                <Lock className="size-4" />
              </InputGroupAddon>
            </InputGroup>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-muted-foreground text-xs">가입일</dt>
              <dd className="font-mono text-sm">{formatDate(user.created_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">마지막 수정일</dt>
              <dd className="font-mono text-sm">{formatDate(user.modified_at)}</dd>
            </div>
          </dl>
        </SettingsCard>
      </form>
    );
  }
}
