"use server";
// 커뮤니티 게시판 쓰기·페이지네이션 조회 서버 액션입니다.

import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { communityCommentContentSchema, communityPostContentSchema } from "@/lib/zod/community";
import type { AppActionResult } from "@/types/common/action";
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

// 게시글 작성 (작성자 = 자기 채널 주인)
export async function createCommunityPostAction(
  content: string,
): Promise<AppActionResult<{ postId: string }>> {
  const parsed = communityPostContentSchema.safeParse(content);

  if (!parsed.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.community.postCreateFailed };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "커뮤니티 게시글 작성 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("create_community_post", {
    p_actor_user_id: actor.userId,
    p_content: parsed.data,
  });

  if (error || !data) {
    console.error("커뮤니티 게시글 작성 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.postCreateFailed };
  }

  return { success: true, data: { postId: data } };
}

// 게시글 수정 (본인 글만)
export async function updateCommunityPostAction(
  postId: string,
  content: string,
): Promise<AppActionResult> {
  const parsed = communityPostContentSchema.safeParse(content);

  if (!parsed.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.community.postUpdateFailed };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "커뮤니티 게시글 수정 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("update_community_post", {
    p_actor_user_id: actor.userId,
    p_post_id: postId,
    p_content: parsed.data,
  });

  if (error) {
    console.error("커뮤니티 게시글 수정 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.postUpdateFailed };
  }

  return { success: true };
}

// 게시글 삭제 (본인 글만)
export async function deleteCommunityPostAction(postId: string): Promise<AppActionResult> {
  const actor = await getAuthenticatedActorId({
    logLabel: "커뮤니티 게시글 삭제 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("delete_community_post", {
    p_actor_user_id: actor.userId,
    p_post_id: postId,
  });

  if (error) {
    console.error("커뮤니티 게시글 삭제 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.postDeleteFailed };
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
