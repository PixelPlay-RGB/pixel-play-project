// 모달 슬롯 기본값 — 일치하는 인터셉트 라우트가 없으면(직접 진입·하드 로드·다른 페이지)
// 아무것도 렌더하지 않는다. 명명된 슬롯은 자체 default가 없으면 하드 로드 시 404가 난다.
export default function ModalDefault() {
  return null;
}
