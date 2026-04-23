"use client"

import dynamic from "next/dynamic"
import { Smile } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import type { EmojiClickData } from "emoji-picker-react"
import { Theme } from "emoji-picker-react"

// Flairup + shadcn 토큰. 앱이 라이트여도 var(--popover)는 흰색이라, 이모지 패널만 .dark로 감싸 다크 토큰을 쓴다.

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[435px] w-[350px] items-center justify-center text-sm text-muted-foreground">
      로딩…
    </div>
  ),
})

/** shadcn 토큰(부모에 `.dark`가 있을 때 다크 팔레트로 해석됨) */
const eprThemedStyle = {
  // 기본 캔버스
  "--epr-bg-color": "var(--popover)",
  "--epr-picker-border-color": "var(--border)",
  "--epr-picker-border-radius": "var(--radius-lg)",
  // 텍스트
  "--epr-text-color": "var(--muted-foreground)",
  // 검색
  "--epr-search-input-bg-color": "var(--muted)",
  "--epr-search-input-text-color": "var(--foreground)",
  "--epr-search-input-placeholder-color": "var(--muted-foreground)",
  "--epr-search-input-bg-color-active": "var(--background)",
  "--epr-search-border-color": "var(--border)",
  // 카테고리 / 라벨
  "--epr-category-label-bg-color": "color-mix(in oklch, var(--background) 92%, transparent)",
  "--epr-category-icon-active-color": "var(--primary)",
  // 호버 / 포커스
  "--epr-hover-bg-color": "var(--accent)",
  "--epr-focus-bg-color": "var(--accent)",
  "--epr-hover-bg-color-reduced-opacity": "color-mix(in oklch, var(--accent) 50%, transparent)",
  "--epr-highlight-color": "var(--primary)",
  // 이모지 그리드
  "--epr-emoji-hover-color": "var(--accent)",
  "--epr-emoji-variation-picker-bg-color": "var(--popover)",
  "--epr-emoji-variation-indicator-color": "var(--border)",
  // 미리보기
  "--epr-preview-border-color": "var(--border)",
  "--epr-preview-text-color": "var(--foreground)",
  // 스킨톤
  "--epr-skin-tone-picker-menu-color": "var(--popover)",
  "--epr-skin-tone-outer-border-color": "var(--border)",
  "--epr-skin-tone-inner-border-color": "var(--popover)",
  // dark 테마 토대(라이브러리 DARK 경로) — html.dark에서도 토큰이 같이 바뀜
  "--epr-dark-bg-color": "var(--popover)",
  "--epr-dark-picker-border-color": "var(--border)",
  "--epr-dark-text-color": "var(--muted-foreground)",
  "--epr-dark-search-input-bg-color": "var(--muted)",
  "--epr-dark-category-label-bg-color": "color-mix(in oklch, var(--background) 88%, transparent)",
  "--epr-dark-hover-bg-color": "var(--accent)",
  "--epr-dark-focus-bg-color": "var(--accent)",
  "--epr-dark-highlight-color": "var(--primary)",
  "--epr-dark-emoji-variation-picker-bg-color": "var(--popover)",
  "--epr-dark-category-icon-active-color": "var(--primary)",
} as const satisfies Record<string, string>

interface Props {
  onEmojiSelect: (emoji: string) => void
  disabled?: boolean
}

export default function ChatEmojiPicker({
  onEmojiSelect,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false)

  function handleEmojiClick(data: EmojiClickData) {
    if (disabled) return
    onEmojiSelect(data.emoji)
    setOpen(false)
  }

  return (
    <Popover
      open={disabled ? false : open}
      onOpenChange={(next) => !disabled && setOpen(next)}
    >
      <PopoverTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            size="icon-sm"
            variant="secondary"
            aria-label="이모지 선택"
            disabled={disabled}
          >
            <Smile className="size-4" />
          </Button>
        )}
      />
      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-auto border-0 bg-transparent p-0 shadow-xl ring-0"
      >
        {open ? (
          <div className="dark emoji-picker-panel">
            <EmojiPicker
              lazyLoadEmojis
              className="font-sans text-foreground"
              style={{
                fontFamily:
                  "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
                ...eprThemedStyle,
              }}
              theme={Theme.DARK}
              onEmojiClick={handleEmojiClick}
            />
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
