// 방송운영 화면 dev 머지 전, 본인 creatorId의 real 방송 데이터로 통계 UI를 검증하기 위한 mock 자산입니다. 머지 후 이 파일을 삭제합니다.

// .env.local의 NEXT_PUBLIC_ANALYTICS_MOCK_CREATOR_ID가 있으면 그 값을 RPC actor로 쓴다. 반환값(string|null)이 곧 mock 토글.
export function getMockAnalyticsCreatorId(): string | null {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const creatorId = process.env.NEXT_PUBLIC_ANALYTICS_MOCK_CREATOR_ID?.trim();

  return creatorId ? creatorId : null;
}
