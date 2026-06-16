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
    profile: {
      updated: {
        title: "프로필 수정 완료",
        description: "변경한 프로필 정보가 저장되었습니다.",
      },
    },
    user: {
      subscriptionCanceled: {
        title: "구독 해지 완료",
        description: "내 구독 목록에 변경 내용이 반영됐습니다.",
      },
    },
    oauth: {
      unlinked: {
        title: "연동 해제 완료",
      },
    },
    channel: {
      securityCopied: {
        title: "복사 완료",
        description: "OBS에 바로 붙여 넣을 수 있습니다.",
      },
      securityTokenRotated: {
        title: "새 정보 생성 완료",
        description: "OBS에 새 정보를 다시 붙여 넣어주세요.",
      },
      chatSettingsSaved: {
        title: "저장 완료",
        description: "새 채팅 설정을 다음 채팅부터 적용합니다.",
      },
      liveSettingsSaved: {
        title: "방송 설정 저장 완료",
        description: "방송 운영 설정이 저장되었습니다.",
      },
      donationSettingsSaved: {
        title: "저장 완료",
        description: "새 후원 설정을 다음 방송부터 적용합니다.",
      },
      donationTestSent: {
        title: "테스트 후원 전송 완료",
        description: "OBS 후원 알림 화면에서 확인해주세요.",
      },
      subscriptionBadgeSaved: {
        title: "구독 배지 저장 완료",
        description: "채팅에 표시되는 구독 배지가 변경됐어요.",
      },
      subscriptionBadgeDeleted: {
        title: "구독 배지 기본값 적용",
        description: "커스텀 배지를 제거했어요.",
      },
      channelProfileSaved: {
        title: "채널 정보 저장 완료",
        description: "변경한 채널 소개와 링크가 적용되었어요.",
      },
      bannerSaved: {
        title: "배너 저장 완료",
      },
      bannerDeleted: {
        title: "배너 삭제 완료",
      },
      managerAdded: {
        title: "매니저 추가 완료",
      },
      managerRemoved: {
        title: "매니저 해제 완료",
      },
    },
    following: {
      followed: {
        title: "팔로잉 완료",
        description: "다시 보고 싶은 크리에이터로 저장했어요.",
      },
      unfollowed: {
        title: "팔로잉 해제 완료",
        description: "팔로잉 목록에서 제외했어요.",
      },
    },
    donation: {
      chargeConfirmed: {
        title: "충전 완료",
        description: "후원 지갑 잔액에 충전 금액을 반영했습니다.",
      },
    },
    community: {
      postCreated: {
        title: "게시글 등록 완료",
        description: "새 글이 채널 커뮤니티에 게시되었어요.",
      },
      postDeleted: {
        title: "게시글 삭제 완료",
      },
      commentCreated: {
        title: "댓글 등록 완료",
      },
      commentDeleted: {
        title: "댓글 삭제 완료",
      },
      postUpdated: {
        title: "게시글 수정 완료",
      },
      commentUpdated: {
        title: "댓글 수정 완료",
      },
    },
    live: {
      subscribed: {
        title: "구독 완료",
        description: "구독자 뱃지가 채팅에 표시됩니다.",
      },
      urlCopied: {
        title: "링크 복사 완료",
        description: "방송 링크 복사가 완료되었습니다.",
      },
      voteUnchanged: {
        title: "이미 선택한 항목",
        description: "다른 항목 번호를 입력하면 투표가 변경됩니다.",
      },
    },
    clip: {
      created: {
        title: "클립 생성 완료",
        description: "클립이 준비되었어요.",
      },
      urlCopied: {
        title: "링크 복사 완료",
        description: "클립 링크 복사가 완료되었습니다.",
      },
      deleted: {
        title: "클립 삭제 완료",
        description: "클립을 삭제했어요.",
      },
    },
    notification: {
      allDeleted: {
        title: "알림 전체 삭제 완료",
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
    user: {
      subscriptionLoadFailed: {
        title: "구독 조회 실패",
        description: "내 구독 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      },
      subscriptionCancelFailed: {
        title: "구독 해지 실패",
        description: "구독 해지를 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
      },
    },
    // 라이브 메시지 RPC 에러 매핑(MESSAGE_RPC_ERROR_CODE_MAP)에서 사용.
    chatRoom: {
      notFound: {
        title: "채팅방 없음",
        description: "채팅방을 찾을 수 없습니다.",
      },
      isKicked: {
        title: "강퇴된 방",
        description: "이 방에서는 메시지를 보낼 수 없습니다.",
      },
    },
    liveList: {
      loadFailed: {
        title: "라이브 목록 조회 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
    },
    search: {
      loadFailed: {
        title: "검색 결과 조회 실패",
        description: "잠시 후 다시 검색해 주세요.",
      },
    },
    donation: {
      invalidChargeAmount: {
        title: "충전 금액 확인 필요",
        description: "충전 금액을 다시 확인해주세요.",
      },
      loadFailed: {
        title: "후원 내역 조회 실패",
        description: "후원 지갑 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      },
      prepareChargeFailed: {
        title: "충전 준비 실패",
        description: "충전 주문을 준비하지 못했습니다. 잠시 후 다시 시도해주세요.",
      },
      confirmChargeFailed: {
        title: "충전 승인 실패",
        description: "결제 승인 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      },
      chargeFailed: {
        title: "충전 실패",
        description: "결제가 완료되지 않았습니다. 다시 충전해 주세요.",
      },
      chargeCanceled: {
        title: "충전 취소",
        description: "결제가 취소되어 후원 지갑에 반영되지 않았습니다.",
      },
      paymentWindowConfigMissing: {
        title: "결제 키 필요",
        description: "결제 설정이 필요합니다. 관리자에게 문의하거나 잠시 후 다시 시도해주세요.",
      },
      paymentWindowLoadFailed: {
        title: "결제창 로드 실패",
        description: "결제창을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
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
      slowMode: {
        title: "채팅 속도 제한",
        description: "조금 천천히 보내면 다시 채팅할 수 있어요.",
      },
      linkBlocked: {
        title: "링크 전송 불가",
        description: "이 방송에서는 링크를 보낼 수 없어요.",
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
    channel: {
      chatSettingsLoadFailed: {
        title: "채팅 설정 조회 실패",
        description: "다시 로그인하거나 잠시 후 새로고침해주세요.",
      },
      chatSettingsSaveFailed: {
        title: "채팅 설정 저장 실패",
        description: "입력값을 확인한 뒤 다시 시도해주세요.",
      },
      liveSettingsSaveFailed: {
        title: "방송 설정 저장 실패",
        description: "입력값을 확인한 뒤 다시 시도해주세요.",
      },
      liveThumbnailUploadFailed: {
        title: "미리보기 이미지 업로드 실패",
        description: "미리보기 이미지를 업로드하지 못했습니다.",
      },
      liveStartSaveFailed: {
        title: "방송 시작 저장 실패",
        description: "방송 시작 정보를 저장하지 못했습니다.",
      },
      liveEndSaveFailed: {
        title: "방송 종료 저장 실패",
        description: "방송 종료 정보를 저장하지 못했습니다.",
      },
      donationSettingsLoadFailed: {
        title: "후원 설정 조회 실패",
        description: "다시 로그인하거나 잠시 후 새로고침해주세요.",
      },
      donationSettingsSaveFailed: {
        title: "후원 설정 저장 실패",
        description: "입력값을 확인한 뒤 다시 시도해주세요.",
      },
      donationTestFailed: {
        title: "테스트 후원 전송 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      settlementLoadFailed: {
        title: "정산 내역 조회 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      securityLoadFailed: {
        title: "방송 연결 정보 조회 실패",
        description: "다시 로그인하거나 잠시 후 새로고침해주세요.",
      },
      securityCopyFailed: {
        title: "복사 실패",
        description: "브라우저 권한을 확인한 뒤 다시 시도해주세요.",
      },
      securityTokenRotateFailed: {
        title: "새 정보 생성 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      analyticsLoadFailed: {
        title: "통계 조회 실패",
        description: "다시 로그인하거나 잠시 후 새로고침해주세요.",
      },
      subscriptionLoadFailed: {
        title: "구독자 조회 실패",
        description: "다시 로그인하거나 잠시 후 새로고침해주세요.",
      },
      subscriptionBadgeSaveFailed: {
        title: "구독 배지 저장 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      subscriptionBadgeDeleteFailed: {
        title: "구독 배지 삭제 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      subscriptionBadgeImageInvalid: {
        title: "구독 배지 이미지 확인 필요",
        description: "가로세로 60px인 PNG 파일을 올려주세요.",
      },
      subscriptionBadgeImageTooLarge: {
        title: "구독 배지 용량 초과",
        description: "1MB 이하의 PNG 파일을 올려주세요.",
      },
      channelProfileSaveFailed: {
        title: "채널 정보 저장 실패",
        description: "입력값을 확인한 뒤 다시 시도해주세요.",
      },
      bannerSaveFailed: {
        title: "배너 저장 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      bannerDeleteFailed: {
        title: "배너 삭제 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      bannerImageTooLarge: {
        title: "이미지 용량 초과",
        description: "1MB 이하의 이미지를 선택해주세요.",
      },
      bannerLimitReached: {
        title: "배너 개수 초과",
        description: "배너는 최대 5개까지 등록할 수 있어요.",
      },
      managerListLoadFailed: {
        title: "매니저 목록 조회 실패",
        description: "다시 로그인하거나 잠시 후 새로고침해주세요.",
      },
      managerAddFailed: {
        title: "매니저 추가 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      managerRemoveFailed: {
        title: "매니저 해제 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      managerAlreadyExists: {
        title: "이미 매니저",
        description: "이미 매니저로 등록된 유저예요.",
      },
      managerSelfForbidden: {
        title: "본인 지정 불가",
        description: "자신을 매니저로 지정할 수 없어요.",
      },
      userSearchFailed: {
        title: "유저 검색 실패",
        description: "잠시 후 다시 검색해 주세요.",
      },
    },
    following: {
      failed: {
        title: "팔로잉 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      unfollowFailed: {
        title: "팔로잉 해제 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      loadFailed: {
        title: "팔로잉 목록 조회 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
    },
    live: {
      donationFailed: {
        title: "후원 실패",
        description: "후원 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      donationInsufficientBalance: {
        title: "포인트 부족",
        description: "보유 포인트가 부족해요. 잔액을 확인해주세요.",
      },
      donationDisabled: {
        title: "후원 불가",
        description: "이 방송은 현재 후원을 받지 않아요.",
      },
      donationSelf: {
        title: "후원 불가",
        description: "본인 방송에는 후원할 수 없어요.",
      },
      donationInvalid: {
        title: "후원 정보 확인 필요",
        description: "후원 금액과 내용을 다시 확인해주세요.",
      },
      donationDuplicate: {
        title: "중복 후원 불가",
        description: "잠시 후 다시 시도해주세요.",
      },
      voteFailed: {
        title: "투표 실패",
        description: "투표 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      voteNoActivePoll: {
        title: "진행 중인 투표 없음",
        description: "현재 진행 중인 투표가 없습니다.",
      },
      voteInvalidOption: {
        title: "잘못된 투표 번호",
        description: "유효하지 않은 투표 번호입니다.",
      },
      subscriptionFailed: {
        title: "구독 실패",
        description: "구독 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
    },
    community: {
      postCreateFailed: {
        title: "게시글 등록 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      postDeleteFailed: {
        title: "게시글 삭제 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      postImageTooLarge: {
        title: "이미지 용량 초과",
        description: "이미지는 5MB 이하만 첨부할 수 있어요.",
      },
      postImageUploadFailed: {
        title: "이미지 업로드 실패",
        description: "jpg, png, webp, gif 형식의 이미지를 다시 시도해주세요.",
      },
      commentCreateFailed: {
        title: "댓글 등록 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      commentDeleteFailed: {
        title: "댓글 삭제 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      likeFailed: {
        title: "좋아요 처리 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      loadFailed: {
        title: "커뮤니티 조회 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      postUpdateFailed: {
        title: "게시글 수정 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      commentUpdateFailed: {
        title: "댓글 수정 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
    },
    notification: {
      loadFailed: {
        title: "알림 조회 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      deleteFailed: {
        title: "알림 삭제 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
    },
    clip: {
      createFailed: {
        title: "클립 생성 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      rateLimited: {
        title: "클립 생성 제한",
        description: "클립은 1분에 1개까지 만들 수 있어요.",
      },
      channelFull: {
        title: "클립 보관함 가득 참",
        description: "이 채널의 클립 보관 한도에 도달했어요.",
      },
      tooEarly: {
        title: "클립 생성 불가",
        description: "방송 시작 직후에는 클립을 만들 수 없어요. 잠시 후 시도해주세요.",
      },
      noBroadcast: {
        title: "클립 생성 불가",
        description: "지금은 방송 중이 아니에요.",
      },
      generationFailed: {
        title: "클립 생성 실패",
        description: "시간이 초과되어 클립을 만들지 못했어요. 다시 시도해주세요.",
      },
      loadFailed: {
        title: "클립 불러오기 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      deleteFailed: {
        title: "클립 삭제 실패",
        description: "잠시 후 다시 시도해주세요.",
      },
      notFound: {
        title: "클립을 찾을 수 없어요",
        description: "이미 삭제되었거나 없는 클립이에요.",
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
  info: {
    common: {
      featureNotReady: {
        title: "기능 준비 중",
        description: "조금만 기다려주세요. 곧 제공될 예정이에요.",
      },
    },
    live: {
      broadcastEnded: {
        title: "방송 종료",
        description: "방송이 종료되었습니다.",
      },
      subscriptionPaymentCanceled: {
        title: "구독 결제 취소",
        description: "결제가 취소되어 구독이 시작되지 않았습니다.",
      },
    },
  },
} as const satisfies {
  success: Record<string, Record<string, AppMessage>>;
  error: Record<string, Record<string, AppMessage>>;
  info: Record<string, Record<string, AppMessage>>;
};
