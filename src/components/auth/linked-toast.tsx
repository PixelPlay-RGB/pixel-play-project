"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

const PROVIDER_LABEL = {
  google: "Google",
  github: "GitHub",
} as const;

export default function LinkedToast() {
  const { data, update } = useSession();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (!data?.justLinked) return;

    firedRef.current = true;
    const label = PROVIDER_LABEL[data.justLinked];

    toast.success(`${label} 계정과 연동되었습니다`);
    update({ justLinked: null });
  }, [data?.justLinked, update]);

  return null;
}
