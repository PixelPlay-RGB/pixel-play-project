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

// 댓글 목록 첫 페이지에 낙관적 댓글을 추가합니다(최신순이라 맨 앞).
export function prependComment(
  data: CommunityCommentsResult | undefined,
  comment: CommunityComment,
): CommunityCommentsResult | undefined {
  if (!data) {
    return data;
  }

  return {
    items: [comment, ...data.items],
    totalCount: data.totalCount + 1,
  };
}

// 댓글 목록에서 특정 댓글 본문을 수정 표시와 함께 갱신합니다.
export function applyCommentContent(
  data: CommunityCommentsResult | undefined,
  commentId: string,
  content: string,
  modifiedAt: string,
): CommunityCommentsResult | undefined {
  if (!data) {
    return data;
  }

  return {
    ...data,
    items: data.items.map((item) =>
      item.id === commentId ? { ...item, content, modifiedAt } : item,
    ),
  };
}

// 댓글 목록에서 특정 댓글을 제거합니다.
export function removeComment(
  data: CommunityCommentsResult | undefined,
  commentId: string,
): CommunityCommentsResult | undefined {
  if (!data) {
    return data;
  }

  const exists = data.items.some((item) => item.id === commentId);

  return {
    items: data.items.filter((item) => item.id !== commentId),
    totalCount: exists ? Math.max(0, data.totalCount - 1) : data.totalCount,
  };
}

// 낙관적 댓글 객체를 생성합니다.
export function createOptimisticComment(params: {
  id: string;
  authorId: string;
  authorNickname: string;
  authorPhotoUrl: string | null;
  content: string;
  createdAt: string;
}): CommunityComment {
  return {
    id: params.id,
    authorId: params.authorId,
    authorNickname: params.authorNickname,
    authorPhotoUrl: params.authorPhotoUrl,
    content: params.content,
    createdAt: params.createdAt,
    modifiedAt: null,
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
