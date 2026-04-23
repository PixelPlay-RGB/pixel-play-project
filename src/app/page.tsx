import AuthToastHandler from "@/components/auth/auth-toast-handler";

export default async function Home() {
  return (
    <>
      <AuthToastHandler />
      <div>초기 인덱스 페이지 입니다.</div>
    </>
  );
}
