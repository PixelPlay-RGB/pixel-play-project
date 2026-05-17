// 폼 검증과 필드 오류에 사용하는 문장형 메시지를 관리하는 상수

export const FORM_MESSAGE = {
  auth: {
    emailInvalid: "올바른 이메일 형식을 입력해주세요.",
    emailCheckFailed: "이메일 확인 중 오류가 발생했습니다.",
    emailAlreadyExists: "이미 가입된 이메일입니다.",
    passwordRequired: "비밀번호를 입력해주세요.",
    passwordMin: "비밀번호는 6자 이상이어야 합니다.",
    passwordMismatch: "비밀번호가 일치하지 않습니다.",
    nameMin: "이름은 2자 이상이어야 합니다.",
    nicknameMin: "닉네임은 2자 이상이어야 합니다.",
    nicknameMax: "닉네임은 10자 이하여야 합니다.",
    nicknameInvalidCharacters: "특수문자는 사용할 수 없습니다.",
    nicknameBlank: "닉네임은 공백으로 설정할 수 없습니다.",
    birthRequired: "생년월일을 입력해주세요.",
    phoneInvalid: "올바른 휴대전화번호 형식을 입력해주세요.",
    genderRequired: "성별을 선택해주세요.",
    otpInvalid: "인증 코드가 올바르지 않습니다.",
    currentPasswordInvalid: "현재 비밀번호가 올바르지 않습니다.",
    samePassword: "현재 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.",
  },
  chatRoom: {
    titleRequired: "방 제목을 입력해주세요.",
    titleMax: (max: number) => `방 제목은 ${max}자 이하여야 합니다.`,
    descriptionMax: (max: number) => `방 설명은 ${max}자 이하여야 합니다.`,
    capacityRequired: "참여 가능 인원을 입력해주세요.",
    capacityInteger: "참여 가능 인원은 정수로 입력해주세요.",
    capacityMin: (min: number) => `최소 ${min}명 이상이어야 합니다.`,
    capacityMax: (max: number) => `최대 ${max}명까지 가능합니다.`,
  },
} as const;
