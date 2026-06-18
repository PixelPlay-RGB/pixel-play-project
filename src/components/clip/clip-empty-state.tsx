// 클립이 하나도 없을 때의 빈 상태 — 공용 EmptyState에 클립 톤(클래퍼보드 아이콘·기본 문구)을 입힌다.
// 텍스트만 있던 기존 안내를 대신해 채널 클립 탭 등에서 공용으로 쓴다.

import type { ReactNode } from "react";

import { Clapperboard } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { CLIP_LABEL } from "@/constants/clip/clip";

interface Props {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function ClipEmptyState({
  title = CLIP_LABEL.empty,
  description = "라이브 방송에서 인상적인 순간을 클립으로 남겨보세요.",
  action,
}: Props) {
  return (
    <EmptyState
      icon={<Clapperboard className="size-8" aria-hidden />}
      title={title}
      description={description}
      action={action}
    />
  );
}
