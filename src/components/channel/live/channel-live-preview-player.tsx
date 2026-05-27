"use client";
// MediaMTX HLS 주소를 방송 미리보기 video 요소에 연결합니다.

import Hls from "hls.js";
import { useEffect, useRef } from "react";

interface Props {
  src: string;
  title: string;
}

export default function ChannelLivePreviewPlayer({ src, title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.load();
      return;
    }

    if (!Hls.isSupported()) return;

    const hls = new Hls({
      backBufferLength: 5,
      liveMaxLatencyDuration: 5,
      liveSyncDuration: 3,
      liveSyncMode: "edge",
      lowLatencyMode: true,
      maxBufferLength: 5,
      maxLiveSyncPlaybackRate: 1.2,
    });

    hls.loadSource(src);
    hls.attachMedia(video);

    return () => {
      hls.destroy();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="size-full bg-black object-contain"
      autoPlay
      controls
      muted
      playsInline
      title={title}
    />
  );
}
