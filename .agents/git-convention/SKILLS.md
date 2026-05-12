# [중요]

- 커밋 메시지는 무조건 한글로 작성한다.

## Commit Template

- feat: 새로운 기능 추가
- fix: 버그 수정
- refactor: 리팩토링
- style: 간단한 CSS 수정
- test: 테스트 코드 작성
- chore: 기타(환경설정 변경, 문서 작업, 간단한 작업 등등)

1. Commit Message

- ex) git commit -m "feat(#이슈 번호): 유저의 로그인 기능 추가"

2. Branch name

- ex) git switch -c feat/auth/#이슈 번호
- 도메인 하위 기능은 `feat/도메인/기능/#이슈 번호` 형식으로 작성한다.
  - ex) git switch -c feat/chat-room/sort/#47
