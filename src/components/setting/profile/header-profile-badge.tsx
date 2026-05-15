"use client";

import SettingMenuItem from "@/components/setting/setting-menu-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { SETTING_MENU } from "@/constants/setting-menu";
import { useUser } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { getAvatarFallbackText } from "@/utils/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HeaderProfileBadge() {
  const supabase = createClient();
  const router = useRouter();
  const { data: user, isLoading } = useUser();
  const isCanChangePassword = useAuthStore((state) => state.isCanChangePassword);

  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (isLoading || !user) {
    return <Spinner />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="cursor-pointer outline-none hover:opacity-80">
        <Avatar className={cn("ring-brand ring-2 transition-all duration-200 hover:ring-[3px]")}>
          <AvatarImage src={user.photo_url ?? undefined} />
          <AvatarFallback>{getAvatarFallbackText(user.nickname)}</AvatarFallback>
        </Avatar>
      </PopoverTrigger>

      <PopoverContent className="max-w-max min-w-60 overflow-hidden" align="end">
        <Link
          href={"/profile"}
          onClick={() => setOpen(false)}
          className="hover:bg-muted flex items-center gap-4 rounded-lg p-1"
        >
          <Avatar className="border-brand/10 h-12 w-12 border">
            <AvatarImage src={user.photo_url ?? undefined} />
            <AvatarFallback>{getAvatarFallbackText(user.nickname)}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1">
            <p className={"bg-muted text-brand rounded-sm px-1 py-0.5 text-xs"}>프로필 설정</p>
            <p className="text-foreground keep-space text-lg leading-tight font-bold tracking-tight">
              {user.nickname}
            </p>
          </div>
        </Link>

        <Separator className={"my-1"} />

        <div className="flex flex-col">
          {SETTING_MENU.map((item) =>
            SettingMenuItem(
              item,
              {
                onClose: () => setOpen(false),
                onLogout: handleLogout,
                // actions: {
                //   settings: handleSetting
                // }
              },
              isCanChangePassword,
            ),
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
