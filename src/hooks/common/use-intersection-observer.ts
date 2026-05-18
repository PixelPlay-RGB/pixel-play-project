"use client";
// IntersectionObserver를 React callback ref로 감싼 범용 훅

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

export function useIntersectionObserver(onIntersect: () => void) {
  const callbackRef = useRef(onIntersect);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useLayoutEffect(() => {
    callbackRef.current = onIntersect;
  });

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();

    if (!node) return;

    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) callbackRef.current();
    });

    observerRef.current.observe(node);
  }, []);
}
