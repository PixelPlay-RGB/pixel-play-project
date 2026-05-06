import ProfileForm from "@/components/setting/profile/profile-form";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">프로필</h1>
        <p className="text-muted-foreground text-sm">프로필 관리 페이지입니다.</p>
      </div>
      <ProfileForm />
    </div>
  );
}
