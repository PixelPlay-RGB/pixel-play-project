// 커뮤니티 게시판 서버 조회 로직입니다. (SSR 페이지와 Server Action이 공유)
import "server-only";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import {
  COMMUNITY_COMMENT_PAGE_SIZE,
  COMMUNITY_POST_PAGE_SIZE,
} from "@/constants/community/community";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { AppActionResult } from "@/types/common/action";
import type {
  CommunityAdjacentPosts,
  CommunityComment,
  CommunityCommentSort,
  CommunityCommentsResult,
  CommunityPostDetail,
  CommunityPostsResult,
} from "@/types/community/community";
import { resolveViewerId } from "@/utils/auth/viewer";
import {
  parseCommunityAdjacentPosts,
  parseCommunityCommentReplies,
  parseCommunityComments,
  parseCommunityPostDetail,
  parseCommunityPostsResult,
} from "@/utils/community/community-parser";

export async function getChannelCommunityPosts(
  creatorId: string,
  page = 1,
): Promise<AppActionResult<CommunityPostsResult>> {
  const viewerId = await resolveViewerId();
  const offset = Math.max(page - 1, 0) * COMMUNITY_POST_PAGE_SIZE;
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("get_channel_community_posts", {
    p_creator_id: creatorId,
    p_viewer_id: viewerId ?? undefined,
    p_limit: COMMUNITY_POST_PAGE_SIZE,
    p_offset: offset,
  });

  if (error) {
    console.error("커뮤니티 게시글 목록 조회 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.loadFailed };
  }

  const parsed = parseCommunityPostsResult(data);

  if (!parsed) {
    return { success: false, code: APP_MESSAGE_CODE.error.community.loadFailed };
  }

  return { success: true, data: parsed };
}

export async function getCommunityPostDetail(
  postId: string,
): Promise<AppActionResult<CommunityPostDetail>> {
  const viewerId = await resolveViewerId();
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("get_community_post", {
    p_post_id: postId,
    p_viewer_id: viewerId ?? undefined,
  });

  if (error) {
    console.error("커뮤니티 게시글 조회 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.loadFailed };
  }

  const parsed = parseCommunityPostDetail(data);

  if (!parsed) {
    return { success: false, code: APP_MESSAGE_CODE.error.community.loadFailed };
  }

  return { success: true, data: parsed };
}

export async function getCommunityComments(
  postId: string,
  page = 1,
  sort: CommunityCommentSort = "oldest",
): Promise<AppActionResult<CommunityCommentsResult>> {
  const viewerId = await resolveViewerId();
  const offset = Math.max(page - 1, 0) * COMMUNITY_COMMENT_PAGE_SIZE;
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("get_community_comments", {
    p_post_id: postId,
    p_viewer_id: viewerId ?? undefined,
    p_sort: sort,
    p_limit: COMMUNITY_COMMENT_PAGE_SIZE,
    p_offset: offset,
  });

  if (error) {
    console.error("커뮤니티 댓글 조회 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.loadFailed };
  }

  return { success: true, data: parseCommunityComments(data) };
}

// 대댓글 목록(토글 시 지연 로드).
export async function getCommunityCommentReplies(
  parentId: string,
): Promise<AppActionResult<CommunityComment[]>> {
  const viewerId = await resolveViewerId();
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("get_community_comment_replies", {
    p_parent_id: parentId,
    p_viewer_id: viewerId ?? undefined,
  });

  if (error) {
    console.error("커뮤니티 대댓글 조회 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.loadFailed };
  }

  return { success: true, data: parseCommunityCommentReplies(data) };
}

// 게시글 상세의 이전/다음 글(없으면 null). 실패해도 네비게이션만 비표시.
export async function getCommunityPostNeighbors(postId: string): Promise<CommunityAdjacentPosts> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("get_community_adjacent_posts", {
    p_post_id: postId,
  });

  if (error) {
    console.error("커뮤니티 인접 글 조회 실패", error);
    return { prev: null, next: null };
  }

  return parseCommunityAdjacentPosts(data);
}
