// 앱 전역에서 사용하는 사용자 표시 메시지와 메시지 코드를 관리하는 상수

import type { AppMessage } from "@/types/common/app-message";

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
        title: "로그인 완료",
      },
      signup: {
        title: "회원가입 완료",
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
        description: "생성한 채팅방으로 이동합니다.",
      },
      left: {
        title: "채팅방 나가기 완료",
        description: "채팅방 목록으로 이동합니다.",
      },
    },
    chatRoomMember: {
      kicked: {
        title: "강퇴 완료",
        description: "참여자가 채팅방에서 제외되었습니다.",
      },
      ownerTransferred: {
        title: "방장 위임 완료",
        description: "방장 권한이 위임되었습니다.",
      },
    },
    profile: {
      updated: {
        title: "프로필 수정 완료",
        description: "변경한 프로필 정보가 저장되었습니다.",
      },
    },
    oauth: {
      unlinked: {
        title: "연동 해제 완료",
      },
    },
  },
  error: {
    common: {
      unknown: {
        title: "처리 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      notFoundPage: {
        title: "페이지 없음",
        description: "아직 준비되지 않은 페이지이거나 이동할 수 없는 주소입니다.",
      },
    },
    auth: {
      invalidCredentials: {
        title: "로그인 실패",
        description: "이메일 또는 비밀번호를 확인해주세요.",
      },
      emailVerificationRequired: {
        title: "이메일 인증 필요",
        description: "먼저 이메일 인증을 완료해주세요.",
      },
      nicknameCheckRequired: {
        title: "닉네임 확인 필요",
        description: "닉네임 중복 확인을 완료해주세요.",
      },
      nicknameCheckFailed: {
        title: "닉네임 확인 실패",
        description: "닉네임 사용 가능 여부를 확인하지 못했습니다.",
      },
      nicknameAlreadyUsed: {
        title: "이미 사용 중인 닉네임",
      },
      invalidInput: {
        title: "입력값 확인 필요",
        description: "입력한 정보를 다시 확인해주세요.",
      },
      authInfoNotFound: {
        title: "인증 정보 없음",
        description: "다시 로그인한 뒤 시도해주세요.",
      },
      authInfoLoadFailed: {
        title: "인증 정보 조회 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      sessionNotFound: {
        title: "인증 정보 없음",
        description: "다시 로그인한 뒤 시도해주세요.",
      },
      passwordChangeFailed: {
        title: "비밀번호 변경 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      passwordChangedLogoutFailed: {
        title: "로그아웃 실패",
        description: "비밀번호가 변경되었습니다. 직접 로그아웃한 뒤 다시 로그인해주세요.",
      },
      signupFailed: {
        title: "회원가입 실패",
        description: "입력한 정보를 확인한 뒤 다시 시도해주세요.",
      },
      profileCreateFailed: {
        title: "프로필 생성 실패",
        description: "프로필 정보를 저장하지 못했습니다.",
      },
      signupCancelFailed: {
        title: "취소 실패",
        description: "회원가입 취소를 완료하지 못했습니다.",
      },
      accountDeleteFailed: {
        title: "계정 삭제 실패",
        description: "계정을 삭제하지 못했습니다.",
      },
      oauthInfoLoadFailed: {
        title: "OAuth 정보 조회 실패",
        description: "소셜 로그인 정보를 불러오지 못했습니다.",
      },
      oauthSyncFailed: {
        title: "OAuth 동기화 실패",
        description: "소셜 로그인 정보를 동기화하지 못했습니다.",
      },
    },
    chatRoom: {
      createAuthRequired: {
        title: "인증 정보 없음",
        description: "다시 로그인한 뒤 채팅방을 생성해주세요.",
      },
      invalidInput: {
        title: "채팅방 정보 확인 필요",
        description: "입력한 채팅방 정보를 다시 확인해주세요.",
      },
      createFailed: {
        title: "채팅방 생성 실패",
        description: "채팅방 정보를 저장하지 못했습니다.",
      },
      createMemberFailed: {
        title: "참여 정보 생성 실패",
        description: "채팅방 참여 정보를 저장하지 못했습니다.",
      },
      joinFailed: {
        title: "채팅방 참여 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      full: {
        title: "채팅방 정원 마감",
        description: "정원이 가득 차 참여할 수 없습니다.",
      },
      leaveFailed: {
        title: "채팅방 나가기 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      leaveOwnerBlocked: {
        title: "방장 나가기 불가",
        description: "다른 참여자에게 방장 권한을 위임한 뒤 나갈 수 있습니다.",
      },
      missingRoomId: {
        title: "방 정보 없음",
        description: "채팅방 주소를 다시 확인해주세요.",
      },
      notFound: {
        title: "채팅방 없음",
        description: "채팅방을 찾을 수 없습니다.",
      },
      notFoundOrLoadFailed: {
        title: "채팅방 조회 실패",
        description: "존재하지 않거나 접근할 수 없는 채팅방입니다.",
      },
      notActiveMember: {
        title: "참여 상태 없음",
        description: "참여 중이 아니거나 이미 나간 채팅방입니다.",
      },
      notMember: {
        title: "참여 정보 없음",
        description: "참여 중인 채팅방이 아닙니다.",
      },
      inputLocked: {
        title: "메시지 전송 불가",
        description: "채팅방 참여 상태를 확인해주세요.",
      },
      isKicked: {
        title: "강퇴된 방",
        description: "이 방에서는 메시지를 보낼 수 없습니다.",
      },
    },
    chatRoomList: {
      loadFailed: {
        title: "채팅방 목록 조회 실패",
        description: "채팅방 목록을 불러오지 못했습니다.",
      },
    },
    search: {
      loadFailed: {
        title: "검색 결과 조회 실패",
        description: "잠시 후 다시 검색해 주세요.",
      },
    },
    chatRoomMember: {
      kickFailed: {
        title: "강퇴 실패",
        description: "참여자를 강퇴하지 못했습니다.",
      },
      transferFailed: {
        title: "방장 위임 실패",
        description: "방장 권한을 위임하지 못했습니다.",
      },
      notOwner: {
        title: "방장 권한 없음",
        description: "방장만 수행할 수 있는 작업입니다.",
      },
      ownerCannotKickSelf: {
        title: "본인 강퇴 불가",
        description: "본인은 강퇴할 수 없습니다.",
      },
      ownerCannotTransferSelf: {
        title: "본인 위임 불가",
        description: "다른 참여자에게 방장 권한을 위임해주세요.",
      },
      targetNotActive: {
        title: "대상 참여 상태 없음",
        description: "대상 참여자가 채팅방에 참여 중인지 확인해주세요.",
      },
      ownerTransferFailed: {
        title: "방장 위임 실패",
        description: "방장 정보를 변경하지 못했습니다.",
      },
    },
    message: {
      invalidInput: {
        title: "메시지 확인 필요",
        description: "메시지 내용을 다시 확인해주세요.",
      },
      sendForbidden: {
        title: "권한 없음",
        description: "메시지를 보낼 수 있는 권한이 없습니다.",
      },
      sendFailed: {
        title: "전송 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
    },
    profile: {
      notFound: {
        title: "프로필 없음",
        description: "프로필 정보를 찾지 못했습니다. 다시 로그인한 뒤 시도해주세요.",
      },
      updateFailed: {
        title: "프로필 수정 실패",
        description: "프로필 변경사항을 저장하지 못했습니다.",
      },
      imageTooLarge: {
        title: "이미지 용량 초과",
        description: "5MB 이하의 이미지를 선택해주세요.",
      },
      authMissing: {
        title: "인증 정보 없음",
        description: "다시 로그인한 뒤 시도해주세요.",
      },
      imageUploadFailed: {
        title: "이미지 저장 실패",
        description: "프로필 이미지를 저장하지 못했습니다.",
      },
      userUpdateFailed: {
        title: "프로필 저장 실패",
        description: "프로필 정보를 저장하지 못했습니다.",
      },
    },
    oauth: {
      linkFailed: {
        title: "연동 실패",
        description: "소셜 계정 연동을 완료하지 못했습니다.",
      },
      unlinkFailed: {
        title: "연동 해제 실패",
        description: "소셜 계정 연동 해제를 완료하지 못했습니다.",
      },
      identityNotFound: {
        title: "연동 계정 없음",
        description: "해제할 소셜 계정을 찾지 못했습니다.",
      },
      userProfileNotFound: {
        title: "프로필 없음",
        description: "현재 계정과 연결된 프로필 정보를 찾지 못했습니다.",
      },
      dbUpdateFailed: {
        title: "계정 정보 저장 실패",
        description: "계정 연동 정보를 저장하지 못했습니다.",
      },
      actionFailed: {
        title: "작업 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      defaultAccountCannotUnlink: {
        title: "기본 계정 해제 불가",
        description: "로그인에 사용하는 기본 계정은 해제할 수 없습니다.",
      },
    },
    supabase: {
      permissionDenied: {
        title: "권한 없음",
        description: "요청한 작업을 수행할 권한이 없습니다.",
      },
      dataNotFound: {
        title: "데이터 없음",
        description: "요청한 데이터를 찾을 수 없습니다.",
      },
    },
  },
} as const satisfies {
  success: Record<string, Record<string, AppMessage>>;
  error: Record<string, Record<string, AppMessage>>;
};
