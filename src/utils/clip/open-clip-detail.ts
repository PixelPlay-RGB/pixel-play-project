// 클립 디테일로 이동 — 별도 창(에디터 팝업)에서 호출되면 작은 팝업 안에서 보는 대신, 부모(메인 탭)를
// 디테일로 보내고 팝업을 닫는다. opener가 없거나(직접 진입/같은 탭 폴백) 접근이 막히면 현재 탭에서 이동.

export function openClipDetail(clipId: string, router: { push: (href: string) => void }) {
  const href = `/clip/${clipId}`;

  if (typeof window !== "undefined" && window.opener && window.opener !== window) {
    try {
      window.opener.location.href = href;
      window.close();
      return;
    } catch {
      // 교차 출처 등으로 opener 접근이 막히면 현재 탭에서 이동한다.
    }
  }

  router.push(href);
}
