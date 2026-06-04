// 크리에이터 채널 커뮤니티(게시판) 관련 상수를 정의합니다.
import type { CommunityCommentSort } from "@/types/community/community";

// 게시글/댓글 본문 최대 길이 (DB CHECK 제약과 동일).
export const COMMUNITY_POST_CONTENT_MAX = 5000;
export const COMMUNITY_COMMENT_CONTENT_MAX = 1000;

// 목록 페이지네이션 크기.
export const COMMUNITY_POST_PAGE_SIZE = 10;
export const COMMUNITY_COMMENT_PAGE_SIZE = 10;

// 댓글 정렬 옵션(치지직: 등록순·인기순·최신순).
export const COMMUNITY_COMMENT_SORTS: ReadonlyArray<{
  value: CommunityCommentSort;
  label: string;
}> = [
  { value: "oldest", label: "등록순" },
  { value: "popular", label: "인기순" },
  { value: "latest", label: "최신순" },
];

export const COMMUNITY_COMMENT_DEFAULT_SORT: CommunityCommentSort = "oldest";
