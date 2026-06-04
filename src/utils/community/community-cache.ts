// 커뮤니티 React Query 캐시를 낙관적으로 갱신하는 순수 헬퍼 모음입니다.
import type {
  CommunityComment,
  CommunityCommentsResult,
  CommunityPost,
  CommunityPostDetail,
  CommunityPostsResult,
} from "@/types/community/community";

interface LikeState {
  liked: boolean;
  likeCount: number;
}

// 목록 캐시(CommunityPostsResult) 안의 특정 게시글 좋아요 상태를 갱신합니다.
export function applyLikeToPostsResult(
  data: CommunityPostsResult | undefined,
  postId: string,
  next: LikeState,
): CommunityPostsResult | undefined {
  if (!data) {
    return data;
  }

  return {
    ...data,
    items: data.items.map((item) =>
      item.id === postId ? { ...item, isLiked: next.liked, likeCount: next.likeCount } : item,
    ),
  };
}

// 상세 캐시(CommunityPostDetail)의 좋아요 상태를 갱신합니다.
export function applyLikeToPostDetail(
  data: CommunityPostDetail | undefined,
  postId: string,
  next: LikeState,
): CommunityPostDetail | undefined {
  if (!data || data.id !== postId) {
    return data;
  }

  return { ...data, isLiked: next.liked, likeCount: next.likeCount };
}

// 상세 캐시의 댓글 수를 증감합니다.
export function applyCommentCountDelta(
  data: CommunityPostDetail | undefined,
  postId: string,
  delta: number,
): CommunityPostDetail | undefined {
  if (!data || data.id !== postId) {
    return data;
  }

  return { ...data, commentCount: Math.max(0, data.commentCount + delta) };
}

// --- CommunityComment[] 단위 헬퍼 (목록 items + 대댓글 캐시 공용) ---

function updateCommentInList(
  list: CommunityComment[],
  commentId: string,
  patch: (comment: CommunityComment) => CommunityComment,
): CommunityComment[] {
  return list.map((item) => (item.id === commentId ? patch(item) : item));
}

export function applyContentToCommentList(
  list: CommunityComment[],
  commentId: string,
  content: string,
  modifiedAt: string,
): CommunityComment[] {
  return updateCommentInList(list, commentId, (item) => ({ ...item, content, modifiedAt }));
}

export function applyLikeToCommentList(
  list: CommunityComment[],
  commentId: string,
  next: LikeState,
): CommunityComment[] {
  return updateCommentInList(list, commentId, (item) => ({
    ...item,
    isLiked: next.liked,
    likeCount: next.likeCount,
  }));
}

export function removeCommentFromList(
  list: CommunityComment[],
  commentId: string,
): CommunityComment[] {
  return list.filter((item) => item.id !== commentId);
}

// --- CommunityCommentsResult(베스트 + items) 단위 헬퍼 ---

function patchBestAndItems(
  data: CommunityCommentsResult,
  commentId: string,
  patch: (comment: CommunityComment) => CommunityComment,
): CommunityCommentsResult {
  return {
    ...data,
    bestComment:
      data.bestComment && data.bestComment.id === commentId
        ? patch(data.bestComment)
        : data.bestComment,
    items: updateCommentInList(data.items, commentId, patch),
  };
}

export function applyCommentContent(
  data: CommunityCommentsResult | undefined,
  commentId: string,
  content: string,
  modifiedAt: string,
): CommunityCommentsResult | undefined {
  if (!data) {
    return data;
  }

  return patchBestAndItems(data, commentId, (item) => ({ ...item, content, modifiedAt }));
}

export function applyCommentLike(
  data: CommunityCommentsResult | undefined,
  commentId: string,
  next: LikeState,
): CommunityCommentsResult | undefined {
  if (!data) {
    return data;
  }

  return patchBestAndItems(data, commentId, (item) => ({
    ...item,
    isLiked: next.liked,
    likeCount: next.likeCount,
  }));
}

export function removeComment(
  data: CommunityCommentsResult | undefined,
  commentId: string,
): CommunityCommentsResult | undefined {
  if (!data) {
    return data;
  }

  const inItems = data.items.some((item) => item.id === commentId);
  const isBest = data.bestComment?.id === commentId;

  return {
    ...data,
    bestComment: isBest ? null : data.bestComment,
    items: data.items.filter((item) => item.id !== commentId),
    totalCount: inItems || isBest ? Math.max(0, data.totalCount - 1) : data.totalCount,
  };
}

// 목록 캐시에서 특정 게시글의 본문을 수정 표시와 함께 갱신합니다.
export function applyPostContent(
  data: CommunityPostsResult | undefined,
  postId: string,
  content: string,
  modifiedAt: string,
): CommunityPostsResult | undefined {
  if (!data) {
    return data;
  }

  return {
    ...data,
    items: data.items.map((item: CommunityPost) =>
      item.id === postId ? { ...item, content, modifiedAt } : item,
    ),
  };
}
