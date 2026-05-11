import type { AppMessage } from "@/types/app-message";

export const APP_MESSAGE = {
  success: {
    auth: {
      emailOtpSent: {
        title: "인증 코드 발송",
        description: "이메일을 확인해주세요.",
      },
      emailVerified: {
        title: "이메일 인증 완료",
        description: "회원 가입을 계속 진행해주세요.",
      },
      linked: {
        title: "계정 연동 완료",
        description: "기존 계정과 소셜 로그인이 연동되었습니다.",
      },
      login: {
        title: "로그인 성공",
      },
      signup: {
        title: "회원가입 성공",
      },
      signupCanceled: {
        title: "가입 취소 완료",
        description: "로그인 페이지로 돌아갑니다.",
      },
      passwordChanged: {
        title: "비밀번호 변경 완료",
        description: "새로운 비밀번호로 다시 로그인해 주세요.",
      },
    },
    chatRoom: {
      created: {
        title: "채팅방 생성 완료",
      },
    },
    profile: {
      updated: {
        title: "프로필 업데이트 완료",
      },
    },
    oauth: {
      unlinked: {
        title: "연동 해제 성공",
      },
    },
  },
  error: {
    common: {
      unknown: {
        title: "오류가 발생했습니다.",
        description: "잠시 후 다시 시도해주세요.",
      },
      notFoundPage: {
        title: "페이지를 찾을 수 없습니다.",
        description: "아직 준비되지 않은 페이지이거나 이동할 수 없는 주소입니다.",
      },
    },
    auth: {
      invalidCredentials: {
        title: "로그인 실패",
        description: "이메일 또는 비밀번호를 확인해주세요.",
      },
      emailCheckFailed: {
        title: "이메일 확인 실패",
        description: "이메일 확인 중 오류가 발생했습니다.",
      },
      emailAlreadyExists: {
        title: "이미 가입된 이메일입니다.",
      },
      otpInvalid: {
        title: "인증 코드가 올바르지 않습니다.",
      },
      emailVerificationRequired: {
        title: "이메일 인증 필요",
        description: "먼저 이메일 인증을 완료해주세요.",
      },
      nicknameCheckRequired: {
        title: "닉네임 중복 확인이 필요합니다.",
        description: "닉네임 중복 확인을 완료해주세요.",
      },
      nicknameCheckFailed: {
        title: "닉네임 확인 실패",
        description: "닉네임 확인 중 오류가 발생했습니다.",
      },
      nicknameAlreadyUsed: {
        title: "이미 사용 중인 닉네임입니다.",
      },
      invalidInput: {
        title: "입력값이 올바르지 않습니다.",
      },
      authInfoNotFound: {
        title: "인증 정보를 찾을 수 없습니다.",
      },
      authInfoLoadFailed: {
        title: "인증 정보를 불러올 수 없습니다.",
        description: "잠시 후 다시 시도해주세요.",
      },
      sessionNotFound: {
        title: "인증 오류",
        description: "유저 세션을 찾을 수 없습니다.",
      },
      currentPasswordInvalid: {
        title: "현재 비밀번호가 올바르지 않습니다.",
      },
      samePassword: {
        title: "현재 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.",
      },
      passwordChangeFailed: {
        title: "비밀번호 변경에 실패했습니다.",
      },
      signupFailed: {
        title: "회원가입 실패",
      },
      profileCreateFailed: {
        title: "프로필 생성 오류",
      },
      signupCancelFailed: {
        title: "취소 실패",
      },
      accountDeleteFailed: {
        title: "계정 삭제 중 오류가 발생했습니다.",
      },
      oauthInfoLoadFailed: {
        title: "OAuth 정보 불러오기 실패",
      },
    },
    chatRoom: {
      createAuthRequired: {
        title: "인증 정보가 없습니다.",
      },
      createFailed: {
        title: "채팅방 생성에 실패했습니다.",
      },
      createMemberFailed: {
        title: "채팅방 참여 정보 생성에 실패했습니다.",
      },
      missingRoomId: {
        title: "방 정보가 없습니다.",
      },
      notFoundOrLoadFailed: {
        title: "존재하지 않는 채팅방이거나 불러올 수 없습니다.",
      },
      inputLocked: {
        title: "메시지를 보낼 수 없습니다.",
      },
    },
    chatRoomList: {
      loadFailed: {
        title: "채팅방 목록을 불러오지 못했습니다.",
      },
    },
    chatRoomMember: {},
    message: {
      sendForbidden: {
        title: "권한 없음",
        description: "메시지를 보낼 수 있는 권한이 없습니다.",
      },
      sendFailed: {
        title: "전송 실패",
        description: "알 수 없는 에러가 발생했습니다.",
      },
    },
    profile: {
      updateFailed: {
        title: "프로필 업데이트 실패",
        description: "프로필 업데이트에 실패했습니다.",
      },
      imageTooLarge: {
        title: "이미지 파일 크기는 5MB를 초과할 수 없습니다.",
      },
      authMissing: {
        title: "유저 인증 정보가 없습니다.",
      },
      imageUploadFailed: {
        title: "이미지 저장에 실패했습니다.",
      },
      userUpdateFailed: {
        title: "유저 업데이트에 실패했습니다.",
      },
    },
    oauth: {
      linkFailed: {
        title: "연동 실패",
      },
      unlinkFailed: {
        title: "연동 해제 실패",
      },
      identityNotFound: {
        title: "연동된 계정을 찾을 수 없습니다.",
      },
      userProfileNotFound: {
        title: "프로필 정보와 일치하는 유저가 없습니다.",
      },
      dbUpdateFailed: {
        title: "데이터베이스 업데이트에 실패했습니다.",
      },
      actionFailed: {
        title: "작업 중 오류 발생",
        description: "알 수 없는 오류가 발생하였습니다.",
      },
      defaultAccountCannotUnlink: {
        title: "기본 계정은 해제할 수 없습니다.",
      },
    },
    supabase: {
      "42501": {
        title: "권한 없음",
        description: "요청한 작업을 수행할 권한이 없습니다.",
      },
      PGRST116: {
        title: "데이터 없음",
        description: "요청한 데이터를 찾을 수 없습니다.",
      },
    },
  },
} as const satisfies {
  success: Record<string, Record<string, AppMessage>>;
  error: Record<string, Record<string, AppMessage>>;
};
