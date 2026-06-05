"use client";
// MediaMTX HLS 주소를 방송 미리보기 video 요소에 연결합니다.

import Hls from "hls.js";
import { useEffect, useRef } from "react";

interface Props {
  src: string;
  title: string;
}

const HLS_RETRY_DELAY_MS = 2000;

export default function ChannelLivePreviewPlayer({ src, title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      let retryTimeout: ReturnType<typeof setTimeout> | null = null;

      const retryLoad = () => {
        if (retryTimeout) clearTimeout(retryTimeout);

        retryTimeout = setTimeout(() => {
          video.load();
        }, HLS_RETRY_DELAY_MS);
      };

      video.src = src;
      video.addEventListener("error", retryLoad);
      video.load();
      return () => {
        if (retryTimeout) clearTimeout(retryTimeout);
        video.removeEventListener("error", retryLoad);
      };
    }

    if (!Hls.isSupported()) return;

    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    const hls = new Hls({
      backBufferLength: 5,
      liveMaxLatencyDuration: 3,
      liveSyncDuration: 1,
      liveSyncMode: "edge",
      lowLatencyMode: true,
      maxBufferLength: 5,
      maxLiveSyncPlaybackRate: 1.2,
    });

    const retryLoad = () => {
      if (retryTimeout) clearTimeout(retryTimeout);

      retryTimeout = setTimeout(() => {
        hls.startLoad(-1);
      }, HLS_RETRY_DELAY_MS);
    };

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        retryLoad();
        return;
      }

      if (data.fatal && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hls.recoverMediaError();
      }
    });

    hls.loadSource(src);
    hls.attachMedia(video);

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      hls.destroy();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="size-full bg-black object-contain"
      autoPlay
      muted
      playsInline
      title={title}
    />
  );
}
