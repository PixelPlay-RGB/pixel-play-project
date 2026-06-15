"use client";
// 유튜브 엠비언트 라이팅 — 재생 중인 영상 프레임을 아주 작은 canvas에 저해상도로 그려(지배색만
// 남김) 컨테이너 전체에 크게 깔고 강하게 흐린다. 화면 밖으로 색이 번지는 은은한 글로우.
// 매 프레임이 아니라 ~12fps로 천천히 갱신해 차분하게(YouTube 결, CPU 절약).
// canvas는 표시 전용(getImageData/toDataURL 같은 readback 없음)이라 cross-origin 영상이어도
// tainted 상태로 정상 렌더된다 — crossOrigin 속성이 필요 없다.

import { useEffect, useRef } from "react";

interface Props {
  // 재생 중인 메인 영상 element getter(미니 플레이어 핸들). 준비 전엔 null.
  getVideo: () => HTMLVideoElement | null;
  // 클립이 바뀌면 즉시 루프를 새 영상 기준으로 재시작한다(키 역할).
  clipId: string;
}

// 작을수록 지배색만 남아 부드럽다(9:16 비율 근사).
const SAMPLE_WIDTH = 12;
const SAMPLE_HEIGHT = 21;
// 매 프레임 대신 천천히 갱신(YouTube 결 — 장면 전환이 튀지 않고 차분하게 번진다).
const UPDATE_INTERVAL_MS = 80;

export function ClipAmbientGlow({ getVideo, clipId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let raf = 0;
    let last = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < UPDATE_INTERVAL_MS) return;
      last = now;
      const video = getVideo();
      if (!video || video.readyState < 2 || video.videoWidth === 0) return;
      // 저해상도 drawImage = 지배색 다운샘플. cross-origin이면 canvas가 tainted되지만 표시엔 무관.
      ctx.drawImage(video, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [getVideo, clipId]);

  return (
    <canvas
      ref={canvasRef}
      width={SAMPLE_WIDTH}
      height={SAMPLE_HEIGHT}
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full scale-110 opacity-50 blur-3xl saturate-150"
    />
  );
}
