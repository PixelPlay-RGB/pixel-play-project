// 앱 메시지 조회에 사용하는 메시지 코드를 관리하는 상수

import type { APP_MESSAGE } from "@/constants/common/app-message";
import type { AppMessageCodeSchema } from "@/types/common/app-message";

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
      left: "success.chatRoom.left",
    },
    chatRoomMember: {
      kicked: "success.chatRoomMember.kicked",
      ownerTransferred: "success.chatRoomMember.ownerTransferred",
    },
    profile: {
      updated: "success.profile.updated",
    },
    oauth: {
      unlinked: "success.oauth.unlinked",
    },
    channel: {
      securityCopied: "success.channel.securityCopied",
      securityTokenRotated: "success.channel.securityTokenRotated",
      chatSettingsSaved: "success.channel.chatSettingsSaved",
      liveSettingsSaved: "success.channel.liveSettingsSaved",
    },
    following: {
      followed: "success.following.followed",
      unfollowed: "success.following.unfollowed",
    },
    live: {
      urlCopied: "success.live.urlCopied",
      voteUnchanged: "success.live.voteUnchanged",
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
      passwordChangedLogoutFailed: "error.auth.passwordChangedLogoutFailed",
      signupFailed: "error.auth.signupFailed",
      profileCreateFailed: "error.auth.profileCreateFailed",
      signupCancelFailed: "error.auth.signupCancelFailed",
      accountDeleteFailed: "error.auth.accountDeleteFailed",
      oauthInfoLoadFailed: "error.auth.oauthInfoLoadFailed",
      oauthSyncFailed: "error.auth.oauthSyncFailed",
    },
    chatRoom: {
      createAuthRequired: "error.chatRoom.createAuthRequired",
      invalidInput: "error.chatRoom.invalidInput",
      createFailed: "error.chatRoom.createFailed",
      createMemberFailed: "error.chatRoom.createMemberFailed",
      joinFailed: "error.chatRoom.joinFailed",
      full: "error.chatRoom.full",
      leaveFailed: "error.chatRoom.leaveFailed",
      leaveOwnerBlocked: "error.chatRoom.leaveOwnerBlocked",
      missingRoomId: "error.chatRoom.missingRoomId",
      notFound: "error.chatRoom.notFound",
      notFoundOrLoadFailed: "error.chatRoom.notFoundOrLoadFailed",
      notActiveMember: "error.chatRoom.notActiveMember",
      notMember: "error.chatRoom.notMember",
      inputLocked: "error.chatRoom.inputLocked",
      isKicked: "error.chatRoom.isKicked",
    },
    chatRoomList: {
      loadFailed: "error.chatRoomList.loadFailed",
    },
    liveList: {
      loadFailed: "error.liveList.loadFailed",
    },
    search: {
      loadFailed: "error.search.loadFailed",
    },
    message: {
      invalidInput: "error.message.invalidInput",
      sendForbidden: "error.message.sendForbidden",
      sendFailed: "error.message.sendFailed",
    },
    chatRoomMember: {
      kickFailed: "error.chatRoomMember.kickFailed",
      transferFailed: "error.chatRoomMember.transferFailed",
      notOwner: "error.chatRoomMember.notOwner",
      ownerCannotKickSelf: "error.chatRoomMember.ownerCannotKickSelf",
      ownerCannotTransferSelf: "error.chatRoomMember.ownerCannotTransferSelf",
      targetNotActive: "error.chatRoomMember.targetNotActive",
      ownerTransferFailed: "error.chatRoomMember.ownerTransferFailed",
    },
    profile: {
      notFound: "error.profile.notFound",
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
    channel: {
      chatSettingsLoadFailed: "error.channel.chatSettingsLoadFailed",
      chatSettingsSaveFailed: "error.channel.chatSettingsSaveFailed",
      liveEndSaveFailed: "error.channel.liveEndSaveFailed",
      liveSettingsSaveFailed: "error.channel.liveSettingsSaveFailed",
      liveStartSaveFailed: "error.channel.liveStartSaveFailed",
      liveThumbnailUploadFailed: "error.channel.liveThumbnailUploadFailed",
      securityLoadFailed: "error.channel.securityLoadFailed",
      securityCopyFailed: "error.channel.securityCopyFailed",
      securityTokenRotateFailed: "error.channel.securityTokenRotateFailed",
    },
    following: {
      failed: "error.following.failed",
      unfollowFailed: "error.following.unfollowFailed",
    },
    live: {
      donationFailed: "error.live.donationFailed",
      voteFailed: "error.live.voteFailed",
      voteNoActivePoll: "error.live.voteNoActivePoll",
      voteInvalidOption: "error.live.voteInvalidOption",
    },
    supabase: {
      permissionDenied: "error.supabase.permissionDenied",
      dataNotFound: "error.supabase.dataNotFound",
    },
  },
} as const satisfies AppMessageCodeSchema<typeof APP_MESSAGE>;

type NestedValue<T> = T extends string
  ? T
  : {
      [K in keyof T]: NestedValue<T[K]>;
    }[keyof T];

export type AppMessageCode = NestedValue<typeof APP_MESSAGE_CODE>;
