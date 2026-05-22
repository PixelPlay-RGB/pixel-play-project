// 랜딩 프리뷰 전용 타입을 정의합니다.
import type { MotionValue } from "motion/react";
import type { ReactNode } from "react";

export type LandingKickerTone = "brand" | "live" | "violet";

export type LandingSceneKey = "live" | "chat" | "creator" | "explore" | "final";

export type LandingAuroraVariant = "global" | "hero" | LandingSceneKey;

export type RevealDirection = "left" | "right" | "up" | "scale";

export type ScrollRange = {
  start: number;
  end: number;
};

export type ParallaxSceneRenderProps = {
  scrollY: MotionValue<number>;
  scrollRange: ScrollRange;
};

export type ParallaxSceneConfig = {
  scene: LandingSceneKey;
  content: (props: ParallaxSceneRenderProps) => ReactNode;
};

export type LandingAuroraBlob = {
  tone: string;
  className: string;
  style: {
    top: string;
    left: string;
    background: string;
  };
  animate: {
    x: string[];
    y: string[];
    scale: number[];
    opacity: number[];
  };
  transition: {
    duration: number;
    delay?: number;
  };
};

export type LandingHeroStat = {
  value: string;
  label: string;
};

export type LandingLiveCard = {
  title: string;
  creator: string;
  viewers: string;
  tone: string;
};

export type LandingChatMessage = {
  name: string;
  color: string;
  text: string;
};

export type LandingTutorialStep = {
  step: string;
  title: string;
  description: string;
  active?: boolean;
};

export type LandingBullet = {
  strong: string;
  rest: string;
};

export type LandingSceneCopy = {
  kicker: string;
  kickerTone: LandingKickerTone;
  titleLines: readonly string[];
  description: string;
  bullets: readonly LandingBullet[];
};
