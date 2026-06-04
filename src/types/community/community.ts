// 크리에이터 채널 커뮤니티(게시판) 화면 타입을 정의합니다.

export interface CommunityCreator {
  id: string;
  nickname: string;
  photoUrl: string | null;
}

// 목록의 개별 게시글 항목.
export interface CommunityPost {
  id: string;
  content: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  modifiedAt: string | null;
  isLiked: boolean;
}

// 채널 게시글 목록 조회 결과(작성자=크리에이터 + 페이지네이션).
export interface CommunityPostsResult {
  creator: CommunityCreator;
  items: CommunityPost[];
  totalCount: number;
}

// 게시글 단건 상세.
export interface CommunityPostDetail {
  id: string;
  creatorId: string;
  creatorNickname: string;
  creatorPhotoUrl: string | null;
  content: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  modifiedAt: string | null;
  isLiked: boolean;
}

// 댓글 정렬 기준 (등록순/인기순/최신순).
export type CommunityCommentSort = "oldest" | "popular" | "latest";

export interface CommunityComment {
  id: string;
  // 상위 댓글이면 null, 대댓글이면 상위 댓글 id.
  parentId: string | null;
  authorId: string;
  authorNickname: string;
  authorPhotoUrl: string | null;
  content: string;
  createdAt: string;
  modifiedAt: string | null;
  likeCount: number;
  isLiked: boolean;
  // 상위 댓글에 달린 대댓글 수.
  replyCount: number;
}

export interface CommunityCommentsResult {
  // 좋아요 최다 상위 댓글(없으면 null). 목록 맨 위에 고정 표시.
  bestComment: CommunityComment | null;
  // 베스트를 제외한 상위 댓글 목록.
  items: CommunityComment[];
  totalCount: number;
}

// 좋아요 토글 결과.
export interface CommunityPostLikeResult {
  liked: boolean;
  likeCount: number;
}
