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
  isLiked: boolean;
}

export interface CommunityComment {
  id: string;
  authorId: string;
  authorNickname: string;
  authorPhotoUrl: string | null;
  content: string;
  createdAt: string;
}

export interface CommunityCommentsResult {
  items: CommunityComment[];
  totalCount: number;
}

// 좋아요 토글 결과.
export interface CommunityPostLikeResult {
  liked: boolean;
  likeCount: number;
}
