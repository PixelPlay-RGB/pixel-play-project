// 랜딩 프리뷰의 섹션 단위 스크롤 이동을 제어합니다.
"use client";

import { animate, type AnimationPlaybackControls } from "motion";
import { useEffect, useRef } from "react";

import { getAppHeaderHeight } from "@/utils/preview/landing-layout";

const LANDING_SECTION_SELECTOR = "[data-landing-section]";
const WHEEL_DELTA_THRESHOLD = 18;
const TOUCH_DELTA_THRESHOLD = 48;
const SECTION_SCROLL_DURATION = 1.25;
const SECTION_SCROLL_EASE = [0.4, 0, 0.2, 1] as const;
const SECTION_EDGE_THRESHOLD = 24;

function getLandingSections() {
  return Array.from(document.querySelectorAll<HTMLElement>(LANDING_SECTION_SELECTOR));
}

function getElementTop(element: HTMLElement) {
  return Math.round(element.getBoundingClientRect().top + window.scrollY);
}

function getSectionTopScrollY(section: HTMLElement) {
  return Math.round(getElementTop(section) - getAppHeaderHeight());
}

function getClosestSectionIndex(sections: HTMLElement[]) {
  const currentY = window.scrollY + getAppHeaderHeight();

  return sections.reduce(
    (closest, section, index) => {
      const distance = Math.abs(getElementTop(section) - currentY);

      if (distance < closest.distance) {
        return { distance, index };
      }

      return closest;
    },
    { distance: Number.POSITIVE_INFINITY, index: 0 },
  ).index;
}

function getSectionEndTop(section: HTMLElement) {
  return Math.round(getElementTop(section) + section.offsetHeight - window.innerHeight);
}

function isScrollableSection(section: HTMLElement) {
  return section.offsetHeight > window.innerHeight + SECTION_EDGE_THRESHOLD;
}

function clampSectionIndex(index: number, sectionCount: number) {
  return Math.max(0, Math.min(index, sectionCount - 1));
}

export function LandingSectionScroller() {
  const animationRef = useRef<AnimationPlaybackControls | null>(null);
  const isAnimatingRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    const finishAnimation = (targetY: number) => {
      window.scrollTo(0, targetY);
      isAnimatingRef.current = false;
      animationRef.current = null;
    };

    const scrollToY = (targetY: number) => {
      const safeTargetY = Math.max(0, targetY);

      if (Math.abs(window.scrollY - safeTargetY) < 4) return false;

      animationRef.current?.stop();
      isAnimatingRef.current = true;

      animationRef.current = animate(window.scrollY, safeTargetY, {
        duration: SECTION_SCROLL_DURATION,
        ease: SECTION_SCROLL_EASE,
        onUpdate: (latest) => window.scrollTo(0, latest),
        onComplete: () => finishAnimation(safeTargetY),
      });

      return true;
    };

    const scrollToSection = (targetIndex: number) => {
      const sections = getLandingSections();
      const targetSection = sections[targetIndex];

      if (!targetSection) return false;

      return scrollToY(getSectionTopScrollY(targetSection));
    };

    const moveByDirection = (direction: 1 | -1) => {
      const sections = getLandingSections();
      if (sections.length === 0) return false;

      const currentIndex = getClosestSectionIndex(sections);
      const currentSection = sections[currentIndex];
      const currentSectionTop = getSectionTopScrollY(currentSection);
      const currentSectionEndTop = getSectionEndTop(currentSection);

      if (
        direction > 0 &&
        isScrollableSection(currentSection) &&
        window.scrollY < currentSectionEndTop - SECTION_EDGE_THRESHOLD
      ) {
        return scrollToY(currentSectionEndTop);
      }

      if (
        direction < 0 &&
        isScrollableSection(currentSection) &&
        window.scrollY > currentSectionTop + SECTION_EDGE_THRESHOLD
      ) {
        return scrollToY(currentSectionTop);
      }

      const nextIndex = clampSectionIndex(currentIndex + direction, sections.length);

      if (nextIndex === currentIndex) return false;

      return scrollToSection(nextIndex);
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      if (Math.abs(event.deltaY) <= Math.max(Math.abs(event.deltaX), WHEEL_DELTA_THRESHOLD)) return;

      if (isAnimatingRef.current) {
        event.preventDefault();
        return;
      }

      const didMove = moveByDirection(event.deltaY > 0 ? 1 : -1);

      if (didMove) {
        event.preventDefault();
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touchStartY = touchStartYRef.current;

      if (isAnimatingRef.current) {
        event.preventDefault();
        return;
      }

      if (touchStartY === null) return;

      const currentY = event.touches[0]?.clientY;
      if (currentY === undefined) return;

      if (Math.abs(touchStartY - currentY) > TOUCH_DELTA_THRESHOLD / 2) {
        event.preventDefault();
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const touchStartY = touchStartYRef.current;
      touchStartYRef.current = null;

      if (touchStartY === null || isAnimatingRef.current) return;

      const touchEndY = event.changedTouches[0]?.clientY;
      if (touchEndY === undefined) return;

      const deltaY = touchStartY - touchEndY;
      if (Math.abs(deltaY) < TOUCH_DELTA_THRESHOLD) return;

      const didMove = moveByDirection(deltaY > 0 ? 1 : -1);

      if (didMove) {
        event.preventDefault();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const nextKeys = ["ArrowDown", "PageDown", " "];
      const previousKeys = ["ArrowUp", "PageUp"];

      if (![...nextKeys, ...previousKeys].includes(event.key)) return;

      if (isAnimatingRef.current) {
        event.preventDefault();
        return;
      }

      const didMove = moveByDirection(nextKeys.includes(event.key) ? 1 : -1);

      if (didMove) {
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      animationRef.current?.stop();
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
