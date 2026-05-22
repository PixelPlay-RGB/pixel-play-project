// 랜딩 프리뷰의 실시간 채팅 섹션을 렌더링합니다.
import { motion } from "motion/react";

import { LiveChatDonation } from "@/components/preview/landing/sections/chat/live-chat-donation";
import { LiveChatIconButton } from "@/components/preview/landing/sections/chat/live-chat-icon-button";
import { LiveChatMessage } from "@/components/preview/landing/sections/chat/live-chat-message";
import { LiveChatQuickAction } from "@/components/preview/landing/sections/chat/live-chat-quick-action";
import { LiveChatSystemMessage } from "@/components/preview/landing/sections/chat/live-chat-system-message";
import { SectionReveal } from "@/components/preview/landing/shared/section-reveal";
import { SceneCopy } from "@/components/preview/landing/shared/scene-copy";
import { SceneVisualFrame } from "@/components/preview/landing/shared/scene-visual-frame";
import {
  LANDING_CHAT_INPUT_PLACEHOLDER,
  LANDING_CHAT_MESSAGES,
  LANDING_SECTION_TEXT,
} from "@/constants/preview/landing-preview";
import { CHAT_ITEM_VARIANTS } from "@/lib/framer-motion/landing-preview";
import { cn } from "@/lib/utils";

export function ChatScene() {
  return (
    <>
      <SectionReveal
        direction="left"
        className="order-2 w-full max-w-sm justify-self-start sm:max-w-md lg:order-1"
      >
        <SceneVisualFrame tilt>
          <div className="flex h-108 flex-col bg-black/15 sm:h-128">
            <div className="border-border flex h-13 items-center justify-between px-4">
              <strong className="text-sm font-black">라이브 채팅</strong>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.3 }}
              className="flex flex-1 flex-col gap-2 overflow-hidden px-4 py-3.5"
            >
              <LiveChatSystemMessage>32분 전에 방송 시작됨</LiveChatSystemMessage>
              {LANDING_CHAT_MESSAGES.map((message, index) => (
                <motion.div key={message.name} custom={index} variants={CHAT_ITEM_VARIANTS}>
                  <LiveChatMessage
                    name={message.name}
                    nameClass={message.color}
                    text={message.text}
                  />
                </motion.div>
              ))}
              <LiveChatDonation />
              <LiveChatSystemMessage>
                금칙어 포함 메시지 1건이 자동으로 가려졌어요
              </LiveChatSystemMessage>
            </motion.div>

            <div className="border-border border-t bg-black/20 px-3.5 py-3">
              <div
                className={cn(
                  "border-border bg-background/70 flex items-center gap-2 rounded-xl border",
                  "py-2 pr-2 pl-3.5",
                )}
              >
                <em className="text-muted-foreground flex-1 truncate text-xs font-semibold not-italic">
                  {LANDING_CHAT_INPUT_PLACEHOLDER}
                </em>
                <LiveChatIconButton>😊</LiveChatIconButton>
                <span className="bg-brand flex size-8 items-center justify-center rounded-lg text-sm font-black text-white">
                  ↑
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <LiveChatQuickAction tone="live">♥ 빠르게 후원하기</LiveChatQuickAction>
                <LiveChatQuickAction>투표 참여</LiveChatQuickAction>
              </div>
            </div>
          </div>
        </SceneVisualFrame>
      </SectionReveal>

      <SectionReveal direction="right" className="order-1 lg:order-2">
        <SceneCopy copy={LANDING_SECTION_TEXT.chat} />
      </SectionReveal>
    </>
  );
}
