"use client";

import { PROFILE_QUERY_KEY } from "@/constants/auth";
import { CHAT_ROOMS_QUERY_KEY } from "@/hooks/use-chat-rooms";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/stores/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

export default function AuthListener() {
  const setUser = useUserStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const syncAuthUser = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      await supabase.auth.signOut({ scope: "local" });
      setUser(null);
      queryClient.removeQueries({ queryKey: PROFILE_QUERY_KEY });
      queryClient.removeQueries({ queryKey: CHAT_ROOMS_QUERY_KEY });
      return;
    }

    setUser(data.user ?? null);
    queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_QUERY_KEY });
  }, [queryClient, setUser]);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_QUERY_KEY });
    });

    syncAuthUser();
    window.addEventListener("pageshow", syncAuthUser);
    window.addEventListener("focus", syncAuthUser);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("pageshow", syncAuthUser);
      window.removeEventListener("focus", syncAuthUser);
    };
  }, [queryClient, setUser, syncAuthUser]);

  return null;
}
