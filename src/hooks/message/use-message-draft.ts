"use client";
// 메시지 입력 draft 변경과 길이 제한을 관리하는 hook
import { useCallback, useState } from "react";

export function useMessageDraft(maxLength: number) {
  const [draft, setDraftState] = useState("");

  const clampDraft = useCallback((value: string) => value.slice(0, maxLength), [maxLength]);

  const setDraft = useCallback(
    (value: string) => {
      setDraftState(clampDraft(value));
    },
    [clampDraft],
  );

  return {
    draft,
    setDraft,
  };
}
