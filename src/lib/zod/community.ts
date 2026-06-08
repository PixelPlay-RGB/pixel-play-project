// 커뮤니티 게시글/댓글 입력값을 검증합니다.

import {
  COMMUNITY_COMMENT_CONTENT_MAX,
  COMMUNITY_POST_CONTENT_MAX,
} from "@/constants/community/community";
import { FORM_MESSAGE } from "@/constants/common/form-message";
import { z } from "zod";

export const communityPostContentSchema = z
  .string()
  .trim()
  .min(1, { error: FORM_MESSAGE.community.postRequired })
  .max(COMMUNITY_POST_CONTENT_MAX, {
    error: FORM_MESSAGE.community.postMax(COMMUNITY_POST_CONTENT_MAX),
  });

export const communityCommentContentSchema = z
  .string()
  .trim()
  .min(1, { error: FORM_MESSAGE.community.commentRequired })
  .max(COMMUNITY_COMMENT_CONTENT_MAX, {
    error: FORM_MESSAGE.community.commentMax(COMMUNITY_COMMENT_CONTENT_MAX),
  });
