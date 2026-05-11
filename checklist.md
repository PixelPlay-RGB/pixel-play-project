# #42 에러 메시지 상수화 및 권한 상태 에러 UI 작업 체크리스트

- [x] `APP_MESSAGE` 메시지 도메인과 코드 체계 확장.
- [x] 앱 메시지 조회 및 toast 헬퍼 추가.
- [x] 기존 `constants/errors.ts` 사용처를 `APP_MESSAGE`로 흡수.
- [x] 주요 toast 사용처를 메시지 코드 기반으로 교체.
- [x] action 반환값을 `code` 기반으로 단계적 정리.
- [x] 채팅방 상세와 목록의 에러 UI 문구를 공통 메시지로 연결.
- [x] 불필요한 import와 기존 에러 상수 파일 정리.
- [x] `npm run build`로 검증.
- [x] 한글 커밋 메시지로 커밋.
