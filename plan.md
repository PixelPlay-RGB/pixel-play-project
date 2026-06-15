# Channel Live Full Operation Plan

`/channel/live`와 `/live`를 MediaMTX 송출 상태 기준으로 실제 운영 가능하게 단계적으로 정리한다.

이번 작업은 사용자가 요청한 각 줄을 별도 커밋 단위로 처리한다. 이미 앞선 커밋에서 일부 구현된 항목도 실제 보완점을 찾아 작은 코드 변경 또는 문서화된 설정 기준으로 커밋한다.

우선순위는 MediaMTX 권한과 서버 프록시, webhook 자동 세션, 송출 상태 UI, HLS preview/viewer, 공개 목록, 투표, 추첨, 룰렛 순서다.

DB 스키마나 RPC 변경이 필요한 경우 migration 파일과 `database.types.ts` 갱신을 함께 처리한다.
