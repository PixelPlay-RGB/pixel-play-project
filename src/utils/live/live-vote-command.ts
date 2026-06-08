// 라이브 채팅에서 사용하는 투표 명령어를 해석합니다.
export function parseLiveVoteCommand(content: string): number | null {
  const voteMatch = /^!([1-9]\d*)$/.exec(content.trim());
  if (!voteMatch) return null;

  return Number(voteMatch[1]);
}
