#!/usr/bin/env python3
# PixelPlay 라이브 클립 워커(#124) — EC2(MediaMTX 호스트)에서 systemd 상주 서비스로 실행.
# clip-worker Edge Function에서 pending 클립을 클레임(4초 폴링)하고, MediaMTX의 60초
# HLS RAM 버퍼에서 요청 구간(클립 시점에서 end_offset만큼 당긴 15~30초)을 ffmpeg로 추출
# (9:16 세로 크롭)해 서명된 업로드 URL로 Storage에 올린 뒤 완료/실패를 보고한다. service key는 받지 않는다.
#
# 추출 방식: 라이브 플레이리스트를 ffmpeg에 직접 물리지 않는다(LL-HLS part·리로드
# 레이스 회피). media playlist를 직접 파싱해 필요한 풀 세그먼트만으로 로컬 VOD
# 플레이리스트를 합성하고, -ss(출력 시킹)로 서브초를 정렬한다.
#
# 비용 게이트: 4초 폴링을 무조건 Edge Function으로 보내면 월 60만+ 호출(무료 티어 초과)이라,
# 무료인 로컬 MediaMTX API로 송출 여부를 먼저 확인하고 송출 중(+종료 후 60초 유예)에만
# 원격 claim을 호출한다. 클립은 송출 중에만 생성되므로 동작 차이는 없다.
#
# 배치 위치: /opt/pixelplay/live-clip-worker.py
# 환경 파일: /etc/pixelplay/clip-worker.env (root 600, systemd EnvironmentFile)
#   CLIP_WORKER_URL    : https://<project-ref>.supabase.co/functions/v1/clip-worker
#   CLIP_WORKER_SECRET : Vault(live_clip_worker_secret)와 동일 값
#   MTX_API_PASSWORD   : mediamtx.yml의 pixelplay-api 계정 비밀번호(송출 게이트용)
#   HLS_BASE_URL       : (선택) 기본 http://127.0.0.1:8888

import base64
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

POLL_INTERVAL_SEC = 4
CLAIM_ERROR_BACKOFF_SEC = 10
# 송출 종료 직후 들어온 요청을 드레인하기 위한 원격 claim 유예 시간.
LIVE_GATE_GRACE_SEC = 60
MTX_API_BASE_URL = "http://127.0.0.1:9997"
MTX_API_USER = "pixelplay-api"
STREAM_PATH_PREFIX = "live/"
HTTP_TIMEOUT_SEC = 15
UPLOAD_TIMEOUT_SEC = 60
FFMPEG_EXTRACT_TIMEOUT_SEC = 90
FFMPEG_THUMBNAIL_TIMEOUT_SEC = 20
WORK_DIR = "/tmp/pixelplay-clip"
# 9:16 크롭 후 표준화 해상도(720p 소스도 동일 출력으로 통일).
OUTPUT_SCALE = "720:1280"


def read_env(name, default=None):
    value = os.environ.get(name, "").strip()
    if not value:
        if default is not None:
            return default
        print(f"missing env: {name}", file=sys.stderr)
        sys.exit(1)
    return value


def parse_iso_datetime(value):
    # DB jsonb의 timestamptz는 마이크로초 자릿수가 들쭉날쭉해(예: .91735) 그대로는
    # fromisoformat이 실패할 수 있다 — 소수부를 6자리로 정규화한다.
    value = value.strip().replace("Z", "+00:00")
    match = re.match(r"^(.*?)(?:\.(\d+))?([+-]\d{2}:\d{2})$", value)
    if match:
        base, fraction, tz = match.groups()
        fraction = ((fraction or "") + "000000")[:6]
        value = f"{base}.{fraction}{tz}"
    return datetime.fromisoformat(value)


def has_ready_live_path(mtx_auth_header):
    # live-thumbnail-push.py와 동일한 조회 — 송출 중인 live/* 경로가 하나라도 있는지.
    request = urllib.request.Request(
        f"{MTX_API_BASE_URL}/v3/paths/list?itemsPerPage=100",
        headers={"Authorization": mtx_auth_header},
    )
    with urllib.request.urlopen(request, timeout=HTTP_TIMEOUT_SEC) as response:
        payload = json.load(response)
    return any(
        item.get("ready") and item.get("name", "").startswith(STREAM_PATH_PREFIX)
        for item in payload.get("items", [])
    )


def call_worker_api(worker_url, worker_secret, payload):
    request = urllib.request.Request(
        worker_url,
        data=json.dumps(payload).encode(),
        method="POST",
        headers={
            "X-Clip-Worker-Secret": worker_secret,
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(request, timeout=HTTP_TIMEOUT_SEC) as response:
        return json.load(response)


def fetch_text(url):
    with urllib.request.urlopen(url, timeout=HTTP_TIMEOUT_SEC) as response:
        return response.read().decode(errors="replace")


def resolve_media_playlist(hls_base_url, stream_path):
    # index.m3u8은 멀티배리언트일 수 있다 — STREAM-INF가 가리키는 (비디오) media playlist로 내려간다.
    # MediaMTX 설정에 따라 오디오가 별도 렌디션(EXT-X-MEDIA:TYPE=AUDIO)으로 분리될 수 있는데,
    # 그 경우 비디오 플레이리스트만 추출하면 클립이 무음이 된다 — 오디오 렌디션 URI도 함께 돌려준다.
    # 반환: (video_media_url, video_text, audio_media_url|None)
    index_url = f"{hls_base_url}/{stream_path}/index.m3u8"
    text = fetch_text(index_url)
    if "#EXT-X-STREAM-INF" not in text:
        # 멀티배리언트가 아니면 단일 플레이리스트(보통 A+V 머스드).
        return index_url, text, None

    lines = text.splitlines()

    audio_media_url = None
    for line in lines:
        if line.startswith("#EXT-X-MEDIA:") and "TYPE=AUDIO" in line:
            match = re.search(r'URI="([^"]+)"', line)
            if match:
                audio_media_url = urllib.parse.urljoin(index_url, match.group(1))
                break

    for i, line in enumerate(lines):
        if line.startswith("#EXT-X-STREAM-INF"):
            for candidate in lines[i + 1 :]:
                candidate = candidate.strip()
                if candidate and not candidate.startswith("#"):
                    media_url = urllib.parse.urljoin(index_url, candidate)
                    return media_url, fetch_text(media_url), audio_media_url
    raise RuntimeError("media playlist not found in multivariant playlist")


def parse_media_playlist(playlist_url, text):
    # 풀 세그먼트(EXTINF + URI)만 수집한다. EXT-X-PART/PRELOAD-HINT 등 LL-HLS 태그는 무시.
    # PROGRAM-DATE-TIME은 "다음 세그먼트"의 시작 시각이다(스펙) — 누적으로 보간한다.
    map_uri = None
    segments = []
    pending_duration = None
    pending_pdt = None

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("#EXT-X-MAP:"):
            match = re.search(r'URI="([^"]+)"', line)
            if match:
                map_uri = urllib.parse.urljoin(playlist_url, match.group(1))
        elif line.startswith("#EXT-X-PROGRAM-DATE-TIME:"):
            pending_pdt = parse_iso_datetime(line.split(":", 1)[1])
        elif line.startswith("#EXTINF:"):
            pending_duration = float(line.split(":", 1)[1].split(",")[0])
        elif not line.startswith("#") and pending_duration is not None:
            segments.append(
                {
                    "uri": urllib.parse.urljoin(playlist_url, line),
                    "duration": pending_duration,
                    "pdt": pending_pdt,
                    "start": None,
                }
            )
            pending_duration = None
            pending_pdt = None

    if not segments:
        raise RuntimeError("no full segments in media playlist")

    # 세그먼트 시작 시각 산출: 첫 PDT 보유 세그먼트를 앵커로 삼아 이후는 누적, 이전은 역산으로
    # 채운다(일부 세그먼트에만 PDT가 있어도 정확한 시각을 버리지 않는다). PDT가 전혀 없으면
    # "플레이리스트 끝 ≈ 현재 시각"으로 앵커링해 전체를 역산한다.
    anchor_index = next(
        (i for i, segment in enumerate(segments) if segment["pdt"] is not None), None
    )
    if anchor_index is not None:
        cursor = segments[anchor_index]["pdt"]
        for segment in segments[anchor_index:]:
            segment["start"] = cursor
            cursor = cursor + timedelta(seconds=segment["duration"])
        cursor = segments[anchor_index]["pdt"]
        for segment in reversed(segments[:anchor_index]):
            cursor = cursor - timedelta(seconds=segment["duration"])
            segment["start"] = cursor
    else:
        total = sum(segment["duration"] for segment in segments)
        cursor = datetime.now(timezone.utc) - timedelta(seconds=total)
        for segment in segments:
            segment["start"] = cursor
            cursor = cursor + timedelta(seconds=segment["duration"])

    return map_uri, segments


def build_vod_playlist(path, map_uri, segments):
    target_duration = max(int(segment["duration"]) + 1 for segment in segments)
    lines = [
        "#EXTM3U",
        "#EXT-X-VERSION:7",
        "#EXT-X-PLAYLIST-TYPE:VOD",
        f"#EXT-X-TARGETDURATION:{target_duration}",
    ]
    if map_uri:
        lines.append(f'#EXT-X-MAP:URI="{map_uri}"')
    for segment in segments:
        lines.append(f"#EXTINF:{segment['duration']:.5f},")
        lines.append(segment["uri"])
    lines.append("#EXT-X-ENDLIST")
    with open(path, "w") as file:
        file.write("\n".join(lines) + "\n")


def select_window_segments(segments, window_start, window_end):
    selected = [
        segment
        for segment in segments
        if segment["start"] + timedelta(seconds=segment["duration"]) > window_start
        and segment["start"] < window_end
    ]
    if not selected:
        raise RuntimeError("requested window is outside the hls buffer")
    fine_ss = max(0.0, (window_start - selected[0]["start"]).total_seconds())
    return selected, fine_ss


def run_ffmpeg(args, timeout):
    result = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", *args],
        capture_output=True,
        timeout=timeout,
    )
    if result.returncode != 0:
        message = result.stderr.decode(errors="replace").strip() or "ffmpeg failed"
        raise RuntimeError(message[-400:])


def extract_clip(
    vod_playlist_path, audio_vod_path, fine_ss, audio_fine_ss, duration, crop_x_fraction, output_path
):
    # crop: 높이를 유지한 9:16 폭(짝수 보정), x는 잔여 폭 대비 비율 매핑.
    crop = (
        "crop=w='floor(ih*9/16/2)*2':h=ih:"
        f"x='floor((iw-ow)*{crop_x_fraction:.6f}/2)*2':y=0"
    )
    video_filter = f"{crop},scale={OUTPUT_SCALE},setsar=1"

    if audio_vod_path:
        # 비디오·오디오가 별도 렌디션 — 각 입력을 window_start로 입력 시킹(-ss를 -i 앞)해 A/V를 맞춘다.
        args = [
            "-protocol_whitelist", "file,http,https,tcp,tls",
            "-ss", f"{fine_ss:.3f}", "-i", vod_playlist_path,
            "-protocol_whitelist", "file,http,https,tcp,tls",
            "-ss", f"{audio_fine_ss:.3f}", "-i", audio_vod_path,
            "-t", str(duration),
            "-map", "0:v:0", "-map", "1:a:0",
            "-vf", video_filter,
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
            "-y", output_path,
        ]
    else:
        # 머스드(A+V 한 세그먼트) — -ss를 -i 뒤(출력 시킹)에 둬 키프레임 경계 오차 없이 정렬(기존 동작).
        args = [
            "-protocol_whitelist", "file,http,https,tcp,tls",
            "-i", vod_playlist_path,
            "-ss", f"{fine_ss:.3f}", "-t", str(duration),
            "-vf", video_filter,
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
            "-y", output_path,
        ]

    run_ffmpeg(args, FFMPEG_EXTRACT_TIMEOUT_SEC)


def extract_thumbnail(video_path, midpoint_sec, output_path):
    run_ffmpeg(
        [
            "-ss", f"{midpoint_sec:.1f}",
            "-i", video_path,
            "-frames:v", "1", "-q:v", "4",
            "-y", output_path,
        ],
        FFMPEG_THUMBNAIL_TIMEOUT_SEC,
    )


def upload_file(upload_url, file_path, content_type):
    with open(file_path, "rb") as file:
        body = file.read()
    request = urllib.request.Request(
        upload_url,
        data=body,
        method="PUT",
        headers={"Content-Type": content_type, "x-upsert": "true"},
    )
    with urllib.request.urlopen(request, timeout=UPLOAD_TIMEOUT_SEC) as response:
        if response.status >= 300:
            raise RuntimeError(f"upload failed: {response.status}")


def process_job(job, hls_base_url, worker_url, worker_secret):
    clip_id = job["clipId"]
    duration = int(job["durationSeconds"])
    # 윈도우 끝 = 클립 시점(created_at) − end_offset. 0이면 직전 N초(기존 동작),
    # 양수면 그만큼 과거로 당긴 [created_at-(offset+duration), created_at-offset] 구간을 뽑는다.
    end_offset = int(job.get("endOffsetSeconds", 0) or 0)
    window_end = parse_iso_datetime(job["createdAt"]) - timedelta(seconds=end_offset)
    window_start = window_end - timedelta(seconds=duration)

    vod_path = os.path.join(WORK_DIR, f"{clip_id}.m3u8")
    audio_vod_path = os.path.join(WORK_DIR, f"{clip_id}.audio.m3u8")
    video_path = os.path.join(WORK_DIR, f"{clip_id}.mp4")
    thumbnail_path = os.path.join(WORK_DIR, f"{clip_id}.jpg")

    try:
        playlist_url, playlist_text, audio_playlist_url = resolve_media_playlist(
            hls_base_url, job["streamPath"]
        )
        map_uri, segments = parse_media_playlist(playlist_url, playlist_text)
        selected, fine_ss = select_window_segments(segments, window_start, window_end)
        build_vod_playlist(vod_path, map_uri, selected)

        # 오디오가 별도 렌디션이면 같은 구간으로 오디오 VOD도 합성해 함께 먹인다(머스드면 None → 단일 입력).
        audio_input = None
        audio_fine_ss = 0.0
        if audio_playlist_url:
            audio_text = fetch_text(audio_playlist_url)
            audio_map, audio_segments = parse_media_playlist(audio_playlist_url, audio_text)
            audio_selected, audio_fine_ss = select_window_segments(
                audio_segments, window_start, window_end
            )
            build_vod_playlist(audio_vod_path, audio_map, audio_selected)
            audio_input = audio_vod_path

        extract_clip(
            vod_path,
            audio_input,
            fine_ss,
            audio_fine_ss,
            duration,
            float(job["cropXFraction"]),
            video_path,
        )
        extract_thumbnail(video_path, duration / 2, thumbnail_path)

        upload_file(job["videoUploadUrl"], video_path, "video/mp4")
        upload_file(job["thumbnailUploadUrl"], thumbnail_path, "image/jpeg")

        call_worker_api(worker_url, worker_secret, {"action": "complete", "clipId": clip_id})
        print(f"{clip_id}: ready (segments={len(selected)} fine_ss={fine_ss:.2f})")
    except Exception as error:
        reason = str(error)[:400]
        print(f"{clip_id}: failed - {reason}", file=sys.stderr)
        try:
            call_worker_api(
                worker_url, worker_secret, {"action": "fail", "clipId": clip_id, "reason": reason}
            )
        except Exception as report_error:
            # 보고 실패 시 RPC의 processing 타임아웃(3분)이 안전망으로 정리한다.
            print(f"{clip_id}: fail report error - {report_error}", file=sys.stderr)
    finally:
        for path in (vod_path, audio_vod_path, video_path, thumbnail_path):
            try:
                os.remove(path)
            except FileNotFoundError:
                pass


def should_claim(mtx_auth_header, last_live_seen):
    # 게이트 판단과 함께 갱신된 last_live_seen을 돌려준다. MediaMTX 조회가 실패하면
    # fail-open(클레임 진행)으로 클립 생성이 막히지 않게 한다.
    try:
        if has_ready_live_path(mtx_auth_header):
            return True, time.monotonic()
    except Exception as error:
        print(f"mediamtx gate error: {error}", file=sys.stderr)
        return True, last_live_seen
    if last_live_seen is not None and time.monotonic() - last_live_seen < LIVE_GATE_GRACE_SEC:
        return True, last_live_seen
    return False, last_live_seen


def main():
    worker_url = read_env("CLIP_WORKER_URL")
    worker_secret = read_env("CLIP_WORKER_SECRET")
    mtx_api_password = read_env("MTX_API_PASSWORD")
    hls_base_url = read_env("HLS_BASE_URL", "http://127.0.0.1:8888").rstrip("/")
    mtx_auth_header = "Basic " + base64.b64encode(
        f"{MTX_API_USER}:{mtx_api_password}".encode()
    ).decode()
    last_live_seen = None
    os.makedirs(WORK_DIR, exist_ok=True)
    print("clip worker started")

    while True:
        try:
            claim_allowed, last_live_seen = should_claim(mtx_auth_header, last_live_seen)
            if claim_allowed:
                response = call_worker_api(worker_url, worker_secret, {"action": "claim"})
                jobs = response.get("jobs", [])
                # 순차 처리 — t3.small에서 인코딩이 송출(MediaMTX)과 경합하지 않게 한다.
                for job in jobs:
                    process_job(job, hls_base_url, worker_url, worker_secret)
        except urllib.error.HTTPError as error:
            print(f"claim http error: {error.code}", file=sys.stderr)
            time.sleep(CLAIM_ERROR_BACKOFF_SEC)
        except Exception as error:
            print(f"claim error: {error}", file=sys.stderr)
            time.sleep(CLAIM_ERROR_BACKOFF_SEC)
        time.sleep(POLL_INTERVAL_SEC)


if __name__ == "__main__":
    main()
