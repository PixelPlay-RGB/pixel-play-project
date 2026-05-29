# 채널 라이브 AWS MediaMTX 연동 메모

## 현재 반영 범위

- 기본 RTMP 서버 URL은 `rtmp://3.34.211.173:1935`로 둔다.
- 기본 HLS 재생 URL은 `http://3.34.211.173:8888/mystream/index.m3u8`로 조합한다.
- `/channel/live` 방송 시작과 종료 버튼은 기존 Supabase RPC `start_live_broadcast`, `end_live_broadcast`를 호출한다.
- DB 스키마와 RPC 정의는 변경하지 않는다.

## 현재 OBS 설정

```txt
서비스: 사용자 지정
서버: rtmp://3.34.211.173:1935
스트림 키: mystream
```

## 개선 필요 사항

- 사용자별 스트림키 발급을 하려면 `creator_stream_key` 같은 별도 테이블이 필요하다.
- 스트림키 원문은 DB에 저장하지 않고 해시만 저장하는 방식이 필요하다.
- MediaMTX publish 인증을 하려면 `/api/mediamtx/auth` Route Handler 또는 `verify_stream_publish` RPC가 필요하다.
- 현재는 `mystream` 단일 path를 사용하므로 여러 사용자가 동시에 각자 방송하는 운영 구조는 아니다.
