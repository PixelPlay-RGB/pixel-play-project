"use server";
// 커뮤니티 게시판 쓰기·페이지네이션 조회 서버 액션입니다.

import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { USER_MEDIA_BUCKET } from "@/constants/common/storage";
import {
  COMMUNITY_IMAGE_ALLOWED_TYPES,
  COMMUNITY_IMAGE_MAX_SIZE,
} from "@/constants/community/community";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import { communityCommentContentSchema, communityPostContentSchema } from "@/lib/zod/community";
import type { AppActionResult } from "@/types/common/action";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";
import { buildCommunityImagePath } from "@/utils/community/community-image";
import type {
  CommunityCommentRepliesResult,
  CommunityCommentSort,
  CommunityCommentsResult,
  CommunityPostDetail,
  CommunityPostLikeResult,
  CommunityPostsResult,
} from "@/types/community/community";
import { parseCommunityPostLikeResult } from "@/utils/community/community-parser";
import {
  getChannelCommunityPosts,
  getCommunityCommentReplies,
  getCommunityComments,
  getCommunityPostDetail,
} from "@/utils/community/community-server";

// 게시글 목록 페이지네이션(클라이언트 "더보기")
export async function fetchChannelCommunityPostsAction(
  creatorId: string,
  page: number,
): Promise<AppActionResult<CommunityPostsResult>> {
  return getChannelCommunityPosts(creatorId, page);
}

// 게시글 단건 조회(클라이언트 갱신용)
export async function fetchCommunityPostDetailAction(
  postId: string,
): Promise<AppActionResult<CommunityPostDetail>> {
  return getCommunityPostDetail(postId);
}

// 댓글 목록 페이지네이션(+ 정렬)
export async function fetchCommunityCommentsAction(
  postId: string,
  page: number,
  sort: CommunityCommentSort = "oldest",
): Promise<AppActionResult<CommunityCommentsResult>> {
  return getCommunityComments(postId, page, sort);
}

// 대댓글 목록 페이지네이션 조회(토글 시 지연 로드 + "답글 더보기")
export async function fetchCommunityCommentRepliesAction(
  parentId: string,
  page = 1,
): Promise<AppActionResult<CommunityCommentRepliesResult>> {
  return getCommunityCommentReplies(parentId, page);
}

// 첨부 이미지 검증(타입·크기). 통과하면 null, 실패면 에러 코드.
function validateCommunityImage(image: File) {
  if (!COMMUNITY_IMAGE_ALLOWED_TYPES.includes(image.type)) {
    return APP_MESSAGE_CODE.error.community.postImageUploadFailed;
  }
  if (image.size > COMMUNITY_IMAGE_MAX_SIZE) {
    return APP_MESSAGE_CODE.error.community.postImageTooLarge;
  }
  return null;
}

// 게시글 작성 (작성자 = 자기 채널 주인). 이미지는 user-context로 업로드 후 admin RPC에 경로 저장.
export async function createCommunityPostAction(
  formData: FormData,
): Promise<AppActionResult<{ postId: string }>> {
  const content = (formData.get("content") as string | null) ?? "";
  const image = formData.get("image") as File | null;
  const hasImage = !!image && image.size > 0;

  const parsed = communityPostContentSchema.safeParse(content);
  if (!parsed.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.community.postCreateFailed };
  }
  if (hasImage) {
    const imageError = validateCommunityImage(image);
    if (imageError) {
      return { success: false, code: imageError };
    }
  }

  const userClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (!user || userError) {
    if (userError && !isAuthSessionMissingError(userError)) {
      console.error("커뮤니티 게시글 작성 중 인증 유저 조회 실패", userError);
    }
    return { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoNotFound };
  }

  let imagePath: string | null = null;
  if (hasImage) {
    imagePath = buildCommunityImagePath(user.id, image.type);
    const { error: uploadError } = await userClient.storage
      .from(USER_MEDIA_BUCKET)
      .upload(imagePath, image, { contentType: image.type, upsert: false });
    if (uploadError) {
      console.error("커뮤니티 이미지 업로드 실패", uploadError);
      return { success: false, code: APP_MESSAGE_CODE.error.community.postImageUploadFailed };
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_community_post", {
    p_actor_user_id: user.id,
    p_content: parsed.data,
    p_image_path: imagePath ?? undefined,
  });

  if (error || !data) {
    if (imagePath) await userClient.storage.from(USER_MEDIA_BUCKET).remove([imagePath]);
    console.error("커뮤니티 게시글 작성 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.postCreateFailed };
  }

  return { success: true, data: { postId: data } };
}

// 게시글 수정 (본인 글만). imageMode: keep(유지)·replace(교체)·remove(제거).
export async function updateCommunityPostAction(
  postId: string,
  formData: FormData,
): Promise<AppActionResult> {
  const content = (formData.get("content") as string | null) ?? "";
  const imageMode = (formData.get("imageMode") as string | null) ?? "keep";
  const image = formData.get("image") as File | null;
  const willReplace = imageMode === "replace" && !!image && image.size > 0;

  const parsed = communityPostContentSchema.safeParse(content);
  if (!parsed.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.community.postUpdateFailed };
  }
  if (willReplace) {
    const imageError = validateCommunityImage(image);
    if (imageError) {
      return { success: false, code: imageError };
    }
  }

  const userClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (!user || userError) {
    if (userError && !isAuthSessionMissingError(userError)) {
      console.error("커뮤니티 게시글 수정 중 인증 유저 조회 실패", userError);
    }
    return { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoNotFound };
  }

  const admin = createAdminClient();
  // 현재 저장된 image_path(교체/제거 시 옛 파일 정리용)를 서버에서 조회한다.
  const { data: currentRow } = await admin
    .from("community_post")
    .select("image_path")
    .eq("id", postId)
    .maybeSingle();
  const currentImagePath = currentRow?.image_path ?? null;

  // 최종 image_path 계산: 유지=기존, 교체=새 업로드, 제거=null.
  let finalImagePath: string | null = currentImagePath;
  let uploadedNew: string | null = null;
  if (imageMode === "remove") {
    finalImagePath = null;
  } else if (willReplace) {
    uploadedNew = buildCommunityImagePath(user.id, image.type);
    const { error: uploadError } = await userClient.storage
      .from(USER_MEDIA_BUCKET)
      .upload(uploadedNew, image, { contentType: image.type, upsert: false });
    if (uploadError) {
      console.error("커뮤니티 이미지 업로드 실패", uploadError);
      return { success: false, code: APP_MESSAGE_CODE.error.community.postImageUploadFailed };
    }
    finalImagePath = uploadedNew;
  }

  const { error } = await admin.rpc("update_community_post", {
    p_actor_user_id: user.id,
    p_post_id: postId,
    p_content: parsed.data,
    p_image_path: finalImagePath ?? undefined,
  });

  if (error) {
    if (uploadedNew) await userClient.storage.from(USER_MEDIA_BUCKET).remove([uploadedNew]);
    console.error("커뮤니티 게시글 수정 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.postUpdateFailed };
  }

  // 교체/제거로 더 이상 안 쓰는 옛 이미지 정리(best-effort).
  if (currentImagePath && currentImagePath !== finalImagePath) {
    await userClient.storage.from(USER_MEDIA_BUCKET).remove([currentImagePath]);
  }

  return { success: true };
}

// 게시글 삭제 (본인 글만). 삭제된 글의 image_path를 받아 storage 정리.
export async function deleteCommunityPostAction(postId: string): Promise<AppActionResult> {
  const userClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (!user || userError) {
    if (userError && !isAuthSessionMissingError(userError)) {
      console.error("커뮤니티 게시글 삭제 중 인증 유저 조회 실패", userError);
    }
    return { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoNotFound };
  }

  const admin = createAdminClient();
  const { data: imagePath, error } = await admin.rpc("delete_community_post", {
    p_actor_user_id: user.id,
    p_post_id: postId,
  });

  if (error) {
    console.error("커뮤니티 게시글 삭제 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.postDeleteFailed };
  }

  if (imagePath) {
    await userClient.storage.from(USER_MEDIA_BUCKET).remove([imagePath]);
  }

  return { success: true };
}

// 좋아요 설정(desired-state, 멱등). liked=true면 좋아요, false면 해제.
export async function setCommunityPostLikeAction(
  postId: string,
  liked: boolean,
): Promise<AppActionResult<CommunityPostLikeResult>> {
  const actor = await getAuthenticatedActorId({
    logLabel: "커뮤니티 좋아요 처리 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("set_community_post_like", {
    p_actor_user_id: actor.userId,
    p_post_id: postId,
    p_liked: liked,
  });

  if (error) {
    console.error("커뮤니티 좋아요 처리 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.likeFailed };
  }

  return { success: true, data: parseCommunityPostLikeResult(data) };
}

// 댓글 좋아요 설정(desired-state, 멱등). 로그인 누구나.
export async function setCommunityCommentLikeAction(
  commentId: string,
  liked: boolean,
): Promise<AppActionResult<CommunityPostLikeResult>> {
  const actor = await getAuthenticatedActorId({
    logLabel: "커뮤니티 댓글 좋아요 처리 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("set_community_comment_like", {
    p_actor_user_id: actor.userId,
    p_comment_id: commentId,
    p_liked: liked,
  });

  if (error) {
    console.error("커뮤니티 댓글 좋아요 처리 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.likeFailed };
  }

  return { success: true, data: parseCommunityPostLikeResult(data) };
}

// 댓글/대댓글 작성 (로그인 누구나). parentId 있으면 대댓글.
export async function createCommunityCommentAction(
  postId: string,
  content: string,
  parentId?: string,
): Promise<AppActionResult<{ commentId: string }>> {
  const parsed = communityCommentContentSchema.safeParse(content);

  if (!parsed.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.community.commentCreateFailed };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "커뮤니티 댓글 작성 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("create_community_comment", {
    p_actor_user_id: actor.userId,
    p_post_id: postId,
    p_content: parsed.data,
    p_parent_id: parentId,
  });

  if (error || !data) {
    console.error("커뮤니티 댓글 작성 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.commentCreateFailed };
  }

  return { success: true, data: { commentId: data } };
}

// 댓글 수정 (본인 댓글만)
export async function updateCommunityCommentAction(
  commentId: string,
  content: string,
): Promise<AppActionResult> {
  const parsed = communityCommentContentSchema.safeParse(content);

  if (!parsed.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.community.commentUpdateFailed };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "커뮤니티 댓글 수정 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("update_community_comment", {
    p_actor_user_id: actor.userId,
    p_comment_id: commentId,
    p_content: parsed.data,
  });

  if (error) {
    console.error("커뮤니티 댓글 수정 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.commentUpdateFailed };
  }

  return { success: true };
}

// 댓글 삭제 (본인 댓글 또는 채널 주인)
export async function deleteCommunityCommentAction(commentId: string): Promise<AppActionResult> {
  const actor = await getAuthenticatedActorId({
    logLabel: "커뮤니티 댓글 삭제 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("delete_community_comment", {
    p_actor_user_id: actor.userId,
    p_comment_id: commentId,
  });

  if (error) {
    console.error("커뮤니티 댓글 삭제 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.commentDeleteFailed };
  }

  return { success: true };
}
