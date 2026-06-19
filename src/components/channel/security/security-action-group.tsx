// 채널 보안 값의 보기, 복사, 미리보기 버튼 묶음을 렌더링합니다.
import { Button } from "@/components/ui/button";
import type { ChannelSecurityTokenKind } from "@/types/channel/security";
import { Clock, Copy, ExternalLink, Eye, EyeOff } from "lucide-react";

export function SecurityActionGroup({
  tokenKind,
  isVisible,
  revealRemaining,
  disabled,
  onToggleVisible,
  onCopy,
  onPreview,
}: {
  tokenKind: ChannelSecurityTokenKind;
  isVisible: boolean;
  revealRemaining: number;
  disabled: boolean;
  onToggleVisible: (tokenKind: ChannelSecurityTokenKind) => void;
  onCopy: () => Promise<void>;
  onPreview?: () => void;
}) {
  // 비활성 사유(보안 값 재발급 진행 중)를 hover로 알 수 있게 한다.
  const disabledTitle = disabled ? "보안 값을 새로 발급하는 동안에는 사용할 수 없어요." : undefined;

  return (
    <div className="flex shrink-0 flex-col items-start gap-1.5 lg:items-end">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={disabled}
          title={disabledTitle}
          onClick={() => onToggleVisible(tokenKind)}
        >
          {isVisible ? <EyeOff /> : <Eye />}
          {isVisible ? "숨기기" : "보기"}
        </Button>
        <Button
          variant="outline"
          disabled={disabled}
          title={disabledTitle}
          onClick={() => void onCopy()}
        >
          <Copy />
          복사
        </Button>
        {onPreview && (
          <Button variant="outline" disabled={disabled} title={disabledTitle} onClick={onPreview}>
            <ExternalLink />
            미리보기
          </Button>
        )}
      </div>
      {/* 노출 중일 때만: 남은 시간을 실시간 카운트다운하고 0초가 되면 자동으로 가려진다. */}
      {isVisible && (
        <p className="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
          <Clock className="size-3 shrink-0" />
          {revealRemaining}초 후 자동으로 다시 가려져요
        </p>
      )}
    </div>
  );
}
