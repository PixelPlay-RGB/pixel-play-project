"use client"

import dynamic from "next/dynamic"
import { Smile } from "lucide-react"
import { useTheme } from "next-themes"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"

import type { EmojiClickData } from "emoji-picker-react"
import { Theme } from "emoji-picker-react"

import { eprThemedStyle } from "@/constants/chat-emoji-picker"

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[435px] w-[350px] items-center justify-center">
      <Spinner className="size-8 text-muted-foreground" />
    </div>
  ),
})

interface Props {
  onEmojiSelect: (emoji: string) => void
  disabled?: boolean
}

export default function ChatEmojiPicker({
  onEmojiSelect,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const { theme } = useTheme()

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
        {open && (
          <div className="emoji-picker-panel">
            <EmojiPicker
              lazyLoadEmojis
              className="font-sans text-foreground"
              style={{
                fontFamily:
                  "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
                ...eprThemedStyle,
              }}
              theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
              onEmojiClick={handleEmojiClick}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
