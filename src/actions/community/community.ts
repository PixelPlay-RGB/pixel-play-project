"use server";
// 커뮤니티 게시판 쓰기·페이지네이션 조회 서버 액션입니다.

import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { communityCommentContentSchema, communityPostContentSchema } from "@/lib/zod/community";
import type { AppActionResult } from "@/types/common/action";
import type {
  CommunityCommentsResult,
  CommunityPostLikeResult,
  CommunityPostsResult,
} from "@/types/community/community";
import { parseCommunityPostLikeResult } from "@/utils/community/community-parser";
import { getChannelCommunityPosts, getCommunityComments } from "@/utils/community/community-server";

// 게시글 목록 페이지네이션(클라이언트 "더보기")
export async function fetchChannelCommunityPostsAction(
  creatorId: string,
  page: number,
): Promise<AppActionResult<CommunityPostsResult>> {
  return getChannelCommunityPosts(creatorId, page);
}

// 댓글 목록 페이지네이션
export async function fetchCommunityCommentsAction(
  postId: string,
  page: number,
): Promise<AppActionResult<CommunityCommentsResult>> {
  return getCommunityComments(postId, page);
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

// 좋아요 토글
export async function toggleCommunityPostLikeAction(
  postId: string,
): Promise<AppActionResult<CommunityPostLikeResult>> {
  const actor = await getAuthenticatedActorId({
    logLabel: "커뮤니티 좋아요 처리 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("toggle_community_post_like", {
    p_actor_user_id: actor.userId,
    p_post_id: postId,
  });

  if (error) {
    console.error("커뮤니티 좋아요 처리 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.likeFailed };
  }

  return { success: true, data: parseCommunityPostLikeResult(data) };
}

// 댓글 작성 (로그인 누구나)
export async function createCommunityCommentAction(
  postId: string,
  content: string,
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
  });

  if (error || !data) {
    console.error("커뮤니티 댓글 작성 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.commentCreateFailed };
  }

  return { success: true, data: { commentId: data } };
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
