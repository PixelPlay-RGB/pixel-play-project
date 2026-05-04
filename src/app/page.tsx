import AuthToastHandler from "@/components/auth/auth-toast-handler";
import MenuTab from "@/components/list/menu-tab";

export default function Home() {
  return (
    <>
      <AuthToastHandler />
      <MenuTab />
    </>
  );
}
