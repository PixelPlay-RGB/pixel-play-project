"use client";
// 단일 값 조절(음량 등)에 쓰는 슬라이더 — @base-ui/react/slider를 래핑합니다.

import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

// 단일 값 전용 래퍼 — Value를 number로 고정해 onValueChange가 number만 넘기도록 한다.
function Slider({ className, ...props }: SliderPrimitive.Root.Props<number>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("relative flex w-full touch-none items-center select-none", className)}
      {...props}
    >
      <SliderPrimitive.Control className="flex w-full items-center py-1.5">
        <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-white/30">
          <SliderPrimitive.Indicator className="bg-live absolute h-full rounded-full" />
          <SliderPrimitive.Thumb className="size-3 rounded-full bg-white shadow-xs outline-none" />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
