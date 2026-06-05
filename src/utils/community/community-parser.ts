// 커뮤니티 게시판 RPC 응답(jsonb)을 화면 타입으로 변환합니다.
import type {
  CommunityAdjacentPost,
  CommunityAdjacentPosts,
  CommunityComment,
  CommunityCommentRepliesResult,
  CommunityCommentsResult,
  CommunityCreator,
  CommunityPost,
  CommunityPostDetail,
  CommunityPostLikeResult,
  CommunityPostsResult,
} from "@/types/community/community";
import type { Json } from "@/types/database.types";
import { getUserMediaPublicUrl } from "@/utils/storage/user-media";

function readImageUrl(value: Json | undefined): string | null {
  const path = typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
  return path ? getUserMediaPublicUrl(path) : null;
}

function readObject(value: Json | undefined): Record<string, Json | undefined> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Json | undefined>;
}

function readArray(value: Json | undefined): Json[] {
  return Array.isArray(value) ? value : [];
}

function readString(value: Json | undefined): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";

  return trimmed.length > 0 ? trimmed : null;
}

function readText(value: Json | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function readNumber(value: Json | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readBoolean(value: Json | undefined): boolean {
  return value === true;
}

function parseCreator(value: Json | undefined): CommunityCreator | null {
  const object = readObject(value);

  if (!object) {
    return null;
  }

  const id = readString(object.id);

  if (!id) {
    return null;
  }

  return {
    id,
    nickname: readString(object.nickname) ?? "크리에이터",
    photoUrl: readString(object.photoUrl),
  };
}

function parsePostItem(value: Json | undefined): CommunityPost | null {
  const object = readObject(value);

  if (!object) {
    return null;
  }

  const id = readString(object.id);
  const content = readText(object.content);
  const createdAt = readString(object.createdAt);

  if (!id || content === null || !createdAt) {
    return null;
  }

  return {
    id,
    content,
    imageUrl: readImageUrl(object.imagePath),
    likeCount: readNumber(object.likeCount),
    commentCount: readNumber(object.commentCount),
    createdAt,
    modifiedAt: readString(object.modifiedAt),
    isLiked: readBoolean(object.isLiked),
  };
}

function parseComment(value: Json | undefined): CommunityComment | null {
  const object = readObject(value);

  if (!object) {
    return null;
  }

  const id = readString(object.id);
  const authorId = readString(object.authorId);
  const content = readText(object.content);
  const createdAt = readString(object.createdAt);

  if (!id || !authorId || content === null || !createdAt) {
    return null;
  }

  return {
    id,
    parentId: readString(object.parentId),
    authorId,
    authorNickname: readString(object.authorNickname) ?? "익명",
    authorPhotoUrl: readString(object.authorPhotoUrl),
    content,
    createdAt,
    modifiedAt: readString(object.modifiedAt),
    likeCount: readNumber(object.likeCount),
    isLiked: readBoolean(object.isLiked),
    replyCount: readNumber(object.replyCount),
  };
}

export function parseCommunityPostsResult(value: Json): CommunityPostsResult | null {
  const object = readObject(value);

  if (!object) {
    return null;
  }

  const creator = parseCreator(object.creator);

  if (!creator) {
    return null;
  }

  const items = readArray(object.items)
    .map(parsePostItem)
    .filter((item): item is CommunityPost => item !== null);

  return {
    creator,
    items,
    totalCount: readNumber(object.totalCount),
  };
}

export function parseCommunityPostDetail(value: Json): CommunityPostDetail | null {
  const object = readObject(value);

  if (!object) {
    return null;
  }

  const id = readString(object.id);
  const creatorId = readString(object.creatorId);
  const content = readText(object.content);
  const createdAt = readString(object.createdAt);

  if (!id || !creatorId || content === null || !createdAt) {
    return null;
  }

  return {
    id,
    creatorId,
    creatorNickname: readString(object.creatorNickname) ?? "크리에이터",
    creatorPhotoUrl: readString(object.creatorPhotoUrl),
    content,
    imageUrl: readImageUrl(object.imagePath),
    likeCount: readNumber(object.likeCount),
    commentCount: readNumber(object.commentCount),
    createdAt,
    modifiedAt: readString(object.modifiedAt),
    isLiked: readBoolean(object.isLiked),
  };
}

export function parseCommunityComments(value: Json): CommunityCommentsResult {
  const object = readObject(value);

  if (!object) {
    return { bestComment: null, items: [], totalCount: 0 };
  }

  const items = readArray(object.items)
    .map(parseComment)
    .filter((item): item is CommunityComment => item !== null);

  return {
    bestComment: parseComment(object.bestComment),
    items,
    totalCount: readNumber(object.totalCount),
  };
}

// 대댓글 페이지네이션 결과({ items, hasMore }) 파싱.
export function parseCommunityCommentReplies(value: Json): CommunityCommentRepliesResult {
  const object = readObject(value);

  if (!object) {
    return { items: [], hasMore: false };
  }

  const items = readArray(object.items)
    .map(parseComment)
    .filter((item): item is CommunityComment => item !== null);

  return { items, hasMore: readBoolean(object.hasMore) };
}

function parseAdjacentPost(value: Json | undefined): CommunityAdjacentPost | null {
  const object = readObject(value);

  if (!object) {
    return null;
  }

  const id = readString(object.id);

  if (!id) {
    return null;
  }

  return { id, content: readText(object.content) ?? "" };
}

export function parseCommunityAdjacentPosts(value: Json): CommunityAdjacentPosts {
  const object = readObject(value);

  if (!object) {
    return { prev: null, next: null };
  }

  return {
    prev: parseAdjacentPost(object.prev),
    next: parseAdjacentPost(object.next),
  };
}

export function parseCommunityPostLikeResult(value: Json): CommunityPostLikeResult {
  const object = readObject(value);

  if (!object) {
    return { liked: false, likeCount: 0 };
  }

  return {
    liked: readBoolean(object.liked),
    likeCount: readNumber(object.likeCount),
  };
}
