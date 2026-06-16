#!/usr/bin/env python3
# PixelPlay 자동 방송 썸네일 푸셔 — EC2(MediaMTX 호스트)에서 systemd 타이머(1분)로 실행.
# MediaMTX Control API에서 송출 중(live/*) 경로를 조회하고, ffmpeg로 1프레임(JPEG)을
# 떠서 Supabase Edge Function(ingest-live-thumbnail)에 push한다.
# 매핑·Storage 업로드·DB 기록은 전부 함수가 담당한다 — 이 스크립트는 캡처와 전송만.
#
# 배치 위치: /opt/pixelplay/live-thumbnail-push.py
# 환경 파일: /etc/pixelplay/live-thumbnail.env (root 600, systemd EnvironmentFile)
#   MTX_API_PASSWORD  : mediamtx.yml의 pixelplay-api 계정 비밀번호
#   INGEST_URL        : https://<project-ref>.supabase.co/functions/v1/ingest-live-thumbnail
#   CAPTURE_SECRET    : Vault(live_thumbnail_ingest_secret)와 동일 값

import base64
import json
import os
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

MTX_API_BASE_URL = "http://127.0.0.1:9997"
MTX_API_USER = "pixelplay-api"
RTSP_BASE_URL = "rtsp://127.0.0.1:8554"
STREAM_PATH_PREFIX = "live/"
FFMPEG_TIMEOUT_SEC = 15
HTTP_TIMEOUT_SEC = 15


def read_env(name):
    value = os.environ.get(name, "").strip()
    if not value:
        print(f"missing env: {name}", file=sys.stderr)
        sys.exit(1)
    return value


def fetch_ready_live_paths(mtx_auth_header):
    request = urllib.request.Request(
        f"{MTX_API_BASE_URL}/v3/paths/list?itemsPerPage=100",
        headers={"Authorization": mtx_auth_header},
    )
    with urllib.request.urlopen(request, timeout=HTTP_TIMEOUT_SEC) as response:
        payload = json.load(response)
    return [
        item["name"]
        for item in payload.get("items", [])
        if item.get("ready") and item.get("name", "").startswith(STREAM_PATH_PREFIX)
    ]


def capture_frame(stream_path):
    result = subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error",
            "-rtsp_transport", "tcp",
            "-i", f"{RTSP_BASE_URL}/{stream_path}",
            "-frames:v", "1", "-vf", "scale=1280:-2", "-q:v", "4",
            "-f", "image2pipe", "-vcodec", "mjpeg", "pipe:1",
        ],
        capture_output=True,
        timeout=FFMPEG_TIMEOUT_SEC,
    )
    if result.returncode != 0 or not result.stdout:
        message = result.stderr.decode(errors="replace").strip() or "empty frame"
        raise RuntimeError(message)
    return result.stdout


def push_frame(ingest_url, capture_secret, stream_path, frame):
    request = urllib.request.Request(
        f"{ingest_url}?path={urllib.parse.quote(stream_path, safe='')}",
        data=frame,
        method="POST",
        headers={
            "X-Capture-Secret": capture_secret,
            "Content-Type": "image/jpeg",
        },
    )
    with urllib.request.urlopen(request, timeout=HTTP_TIMEOUT_SEC) as response:
        return response.status, response.read().decode(errors="replace")


def main():
    mtx_api_password = read_env("MTX_API_PASSWORD")
    ingest_url = read_env("INGEST_URL")
    capture_secret = read_env("CAPTURE_SECRET")
    mtx_auth_header = "Basic " + base64.b64encode(
        f"{MTX_API_USER}:{mtx_api_password}".encode()
    ).decode()

    stream_paths = fetch_ready_live_paths(mtx_auth_header)
    if not stream_paths:
        print("no live streams")
        return

    # 한 스트림의 실패가 다른 스트림 캡처를 막지 않도록 개별 처리한다.
    for stream_path in stream_paths:
        try:
            frame = capture_frame(stream_path)
            status, body = push_frame(ingest_url, capture_secret, stream_path, frame)
            print(f"{stream_path}: {status} {body}")
        except urllib.error.HTTPError as error:
            # 404(매칭되는 활성 방송 없음)는 방송 시작 전 송출 등 정상 상황이다.
            print(f"{stream_path}: {error.code} {error.read().decode(errors='replace')}")
        except Exception as error:
            print(f"{stream_path}: failed - {error}", file=sys.stderr)


if __name__ == "__main__":
    main()
