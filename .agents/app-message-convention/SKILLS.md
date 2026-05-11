# 앱 메시지 컨벤션

`APP_MESSAGE`는 사용자에게 노출되는 toast, alert, error UI 문구를 관리합니다.

## title

- 짧은 명사형 또는 상태형으로 작성합니다.
- 문장형 표현을 사용하지 않습니다.
- 마침표를 붙이지 않습니다.
- 서비스 톤을 부드럽게 만들기 위해 title 앞에는 의미가 명확한 이모지 1개를 사용할 수 있습니다.
- `~합니다`, `~했습니다`, `~할 수 없습니다` 같은 서술형 표현을 사용하지 않습니다.
- 성공 메시지는 `완료`, 실패 메시지는 `실패`, 권한과 상태 메시지는 `없음`, `불가`, `필요`처럼 결과가 분명한 단어로 끝냅니다.

### 좋은 예시

- 🎉 로그인 완료
- 💬 채팅방 생성 실패
- 🔐 인증 정보 없음
- ✉️ 메시지 전송 불가

### 나쁜 예시

- 로그인이 완료되었습니다.
- 채팅방 생성에 실패했습니다.
- 인증 정보가 없습니다.
- 메시지를 보낼 수 없습니다.

## description

- title만으로 부족한 안내를 문장 형태로 작성합니다.
- 사용자가 다음에 해야 할 행동이 있으면 description에 작성합니다.
- 호출부에서 사용자 이름, provider, 닉네임처럼 동적 description을 직접 전달하는 메시지는 description을 생략할 수 있습니다.
- 개발자 디버깅용 원본 에러 메시지는 description에 넣지 않습니다.
- Supabase, Auth, DB 원본 에러는 `console.error`로 남기고 사용자에게는 고정 메시지만 노출합니다.

## Field Error

- Zod, React Hook Form의 `FieldError`로 필드 아래에 표시하는 검증 메시지는 `FORM_MESSAGE`에서 관리합니다.
- FieldError 메시지는 사용자가 입력값을 수정할 수 있도록 문장형으로 작성합니다.
- FieldError 메시지는 `APP_MESSAGE`에 섞지 않고 toast로 중복 노출하지 않습니다.
- 필드 단위 오류는 `setError`와 `FieldError`를 사용하고, 폼 제출 실패나 서버 처리 실패처럼 화면 전체에 알려야 하는 오류만 toast를 사용합니다.

## code

- 메시지 코드는 `APP_MESSAGE_CODE`에서만 관리합니다.
- 호출부에서는 문자열을 직접 작성하지 않고 `APP_MESSAGE_CODE.error.auth.invalidInput`처럼 상수를 사용합니다.
- `APP_MESSAGE`와 `APP_MESSAGE_CODE`의 도메인과 key는 반드시 일치시킵니다.
