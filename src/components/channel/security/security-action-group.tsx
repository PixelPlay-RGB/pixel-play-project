// 채널 보안 값의 보기, 복사, 미리보기 버튼 묶음을 렌더링합니다.
import { Button } from "@/components/ui/button";
import type { ChannelSecurityTokenKind } from "@/types/channel/security";
import { Copy, ExternalLink, Eye, EyeOff } from "lucide-react";

export function SecurityActionGroup({
  tokenKind,
  isVisible,
  disabled,
  onToggleVisible,
  onCopy,
  onPreview,
}: {
  tokenKind: ChannelSecurityTokenKind;
  isVisible: boolean;
  disabled: boolean;
  onToggleVisible: (tokenKind: ChannelSecurityTokenKind) => void;
  onCopy: () => Promise<void>;
  onPreview?: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <Button variant="outline" disabled={disabled} onClick={() => onToggleVisible(tokenKind)}>
        {isVisible ? <EyeOff /> : <Eye />}
        {isVisible ? "숨기기" : "보기"}
      </Button>
      <Button variant="outline" disabled={disabled} onClick={() => void onCopy()}>
        <Copy />
        복사
      </Button>
      {onPreview && (
        <Button variant="outline" disabled={disabled} onClick={onPreview}>
          <ExternalLink />
          미리보기
        </Button>
      )}
    </div>
  );
}
