// 앱 메시지 조회에 사용하는 메시지 코드를 관리하는 상수

export const APP_MESSAGE_CODE = {
  success: {
    auth: {
      emailOtpSent: "success.auth.emailOtpSent",
      emailVerified: "success.auth.emailVerified",
      linked: "success.auth.linked",
      login: "success.auth.login",
      signup: "success.auth.signup",
      signupCanceled: "success.auth.signupCanceled",
      passwordChanged: "success.auth.passwordChanged",
    },
    chatRoom: {
      created: "success.chatRoom.created",
    },
    profile: {
      updated: "success.profile.updated",
    },
    oauth: {
      unlinked: "success.oauth.unlinked",
    },
  },
  error: {
    common: {
      unknown: "error.common.unknown",
      notFoundPage: "error.common.notFoundPage",
    },
    auth: {
      invalidCredentials: "error.auth.invalidCredentials",
      emailVerificationRequired: "error.auth.emailVerificationRequired",
      nicknameCheckRequired: "error.auth.nicknameCheckRequired",
      nicknameCheckFailed: "error.auth.nicknameCheckFailed",
      nicknameAlreadyUsed: "error.auth.nicknameAlreadyUsed",
      invalidInput: "error.auth.invalidInput",
      authInfoNotFound: "error.auth.authInfoNotFound",
      authInfoLoadFailed: "error.auth.authInfoLoadFailed",
      sessionNotFound: "error.auth.sessionNotFound",
      passwordChangeFailed: "error.auth.passwordChangeFailed",
      signupFailed: "error.auth.signupFailed",
      profileCreateFailed: "error.auth.profileCreateFailed",
      signupCancelFailed: "error.auth.signupCancelFailed",
      accountDeleteFailed: "error.auth.accountDeleteFailed",
      oauthInfoLoadFailed: "error.auth.oauthInfoLoadFailed",
    },
    chatRoom: {
      createAuthRequired: "error.chatRoom.createAuthRequired",
      createFailed: "error.chatRoom.createFailed",
      createMemberFailed: "error.chatRoom.createMemberFailed",
      missingRoomId: "error.chatRoom.missingRoomId",
      notFoundOrLoadFailed: "error.chatRoom.notFoundOrLoadFailed",
      inputLocked: "error.chatRoom.inputLocked",
      isKicked: "error.chatRoom.isKicked",
    },
    chatRoomList: {
      loadFailed: "error.chatRoomList.loadFailed",
    },
    message: {
      sendForbidden: "error.message.sendForbidden",
      sendFailed: "error.message.sendFailed",
    },
    profile: {
      updateFailed: "error.profile.updateFailed",
      imageTooLarge: "error.profile.imageTooLarge",
      authMissing: "error.profile.authMissing",
      imageUploadFailed: "error.profile.imageUploadFailed",
      userUpdateFailed: "error.profile.userUpdateFailed",
    },
    oauth: {
      linkFailed: "error.oauth.linkFailed",
      unlinkFailed: "error.oauth.unlinkFailed",
      identityNotFound: "error.oauth.identityNotFound",
      userProfileNotFound: "error.oauth.userProfileNotFound",
      dbUpdateFailed: "error.oauth.dbUpdateFailed",
      actionFailed: "error.oauth.actionFailed",
      defaultAccountCannotUnlink: "error.oauth.defaultAccountCannotUnlink",
    },
    supabase: {
      permissionDenied: "error.supabase.42501",
      dataNotFound: "error.supabase.PGRST116",
    },
  },
} as const;

type NestedValue<T> = T extends string
  ? T
  : {
      [K in keyof T]: NestedValue<T[K]>;
    }[keyof T];

export type AppMessageCode = NestedValue<typeof APP_MESSAGE_CODE>;
