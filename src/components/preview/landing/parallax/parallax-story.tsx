// 랜딩 프리뷰 parallax 스토리 섹션들을 조립합니다.
"use client";

import { useScroll } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";

import { ChatScene } from "@/components/preview/landing/sections/chat/chat-scene";
import { CreatorScene } from "@/components/preview/landing/sections/creator/creator-scene";
import { ExploreScene } from "@/components/preview/landing/sections/explore/explore-scene";
import { FinalCtaScene } from "@/components/preview/landing/sections/final-cta/final-cta-scene";
import { LiveScene } from "@/components/preview/landing/sections/live-scene";
import { ParallaxScene } from "@/components/preview/landing/parallax/parallax-scene";
import type { ParallaxSceneConfig } from "@/types/preview/landing-preview";
import { getAppHeaderHeight } from "@/utils/preview/landing-layout";

const INITIAL_STORY_LAYOUT = {
  sceneTops: [] as number[],
  top: 0,
  viewportHeight: 1,
};

const PARALLAX_SCENES: ParallaxSceneConfig[] = [
  { scene: "live", content: () => <LiveScene /> },
  { scene: "chat", content: () => <ChatScene /> },
  { scene: "creator", content: () => <CreatorScene /> },
  { scene: "explore", content: () => <ExploreScene /> },
  { scene: "final", content: () => <FinalCtaScene /> },
];

export function ParallaxStory() {
  const storyRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const [storyLayout, setStoryLayout] = useState(INITIAL_STORY_LAYOUT);

  useLayoutEffect(() => {
    const updateStoryLayout = () => {
      const story = storyRef.current;
      if (!story) return;

      const headerHeight = getAppHeaderHeight();
      const sceneTops = Array.from(
        story.querySelectorAll<HTMLElement>("[data-parallax-scene]"),
      ).map((section) => section.getBoundingClientRect().top + window.scrollY - headerHeight);

      setStoryLayout({
        sceneTops,
        top: story.getBoundingClientRect().top + window.scrollY - headerHeight,
        viewportHeight: window.innerHeight - headerHeight,
      });
    };

    updateStoryLayout();

    const resizeObserver = new ResizeObserver(updateStoryLayout);
    const story = storyRef.current;

    if (story) {
      resizeObserver.observe(story);
    }

    window.addEventListener("resize", updateStoryLayout);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateStoryLayout);
    };
  }, []);

  return (
    <section ref={storyRef} className="relative w-full" data-parallax-story>
      {PARALLAX_SCENES.map((parallaxScene, index) => {
        const sceneTop =
          storyLayout.sceneTops[index] ?? storyLayout.top + index * storyLayout.viewportHeight;
        const scrollRange = {
          start: sceneTop - storyLayout.viewportHeight,
          end: sceneTop + storyLayout.viewportHeight,
        };

        return (
          <ParallaxScene
            key={parallaxScene.scene}
            scene={parallaxScene.scene}
            index={index}
            scrollY={scrollY}
            scrollRange={scrollRange}
          >
            {parallaxScene.content({ scrollY, scrollRange })}
          </ParallaxScene>
        );
      })}
    </section>
  );
}
