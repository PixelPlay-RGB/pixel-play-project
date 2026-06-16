"use client";
// 구독 리워드 이미지 업로드 모달에서 공통으로 쓰는 입력 컨트롤을 렌더링합니다.

import { Info, Plus } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function formatUploadFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)}KB`;
  }

  return `${Math.round(bytes / 1024 / 1024)}MB`;
}

export function LargeUploadButton({
  label,
  detail,
  fileName,
  previewSrc,
  onClick,
}: {
  label: string;
  detail: string;
  fileName?: string;
  previewSrc?: string | null;
  onClick: () => void;
}) {
  const hasFile = Boolean(fileName || previewSrc);

  return (
    <button
      type="button"
      className={cn(
        "border-border bg-background hover:border-brand/50 hover:bg-brand/5 flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 transition-colors",
        hasFile && "border-brand/40 bg-brand/5",
      )}
      onClick={onClick}
    >
      {previewSrc ? (
        <Image
          src={previewSrc}
          alt=""
          aria-hidden
          width={60}
          height={60}
          unoptimized
          className="border-border bg-card size-15 rounded-md border object-cover shadow-sm"
        />
      ) : (
        <span className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-xl">
          <Plus className="size-7" aria-hidden />
        </span>
      )}
      <span className="text-foreground max-w-full truncate text-sm font-black">
        {fileName ? fileName : label}
      </span>
      <span className="text-muted-foreground text-sm">{detail}</span>
    </button>
  );
}

export function CopyrightAgreement({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="border-border/70 bg-muted/30 flex flex-col gap-2 rounded-lg border p-4">
      <label className="text-muted-foreground flex items-start gap-2 text-sm leading-5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="border-border accent-brand mt-0.5 size-4 rounded"
        />
        저작권법에 위반되는 이미지를 사용하지 않았음에 동의
      </label>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground h-7 w-fit px-0 text-xs"
      >
        자세히보기
        <span aria-hidden>›</span>
      </Button>
    </div>
  );
}

export function InfoNotice({ children }: { children: ReactNode }) {
  return (
    <div className="bg-brand/10 text-brand border-brand/20 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm">
      <Info className="size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}
