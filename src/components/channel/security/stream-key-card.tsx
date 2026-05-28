// 채널 보안 설정의 스트림 URL과 스트림 키 카드를 렌더링합니다.
import { SecurityActionGroup } from "@/components/channel/security/security-action-group";
import { SecurityFieldRow } from "@/components/channel/security/security-field-row";
import { StreamKeyReissueDialog } from "@/components/channel/security/security-reissue-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChannelSecuritySnapshot, ChannelSecurityTokenKind } from "@/types/channel/security";
import { maskSensitiveValue } from "@/utils/channel/channel-security-format";
import { Copy, KeyRound } from "lucide-react";

export function StreamKeyCard({
  snapshot,
  disabled,
  isRotating,
  isStreamKeyVisible,
  onCopy,
  onToggleVisible,
  onRotate,
}: {
  snapshot: ChannelSecuritySnapshot;
  disabled: boolean;
  isRotating: boolean;
  isStreamKeyVisible: boolean;
  onCopy: (value: string) => Promise<void>;
  onToggleVisible: (tokenKind: ChannelSecurityTokenKind) => void;
  onRotate: (tokenKind: ChannelSecurityTokenKind, onSuccess?: () => void) => void;
}) {
  return (
    <Card className="border-live/15 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="text-live size-4" />
          스트림 설정
        </CardTitle>
        <CardDescription>스트림 URL과 스트림 키를 OBS 방송 설정에 입력합니다.</CardDescription>
        <CardAction className="col-start-1 row-start-3 justify-self-start pt-2 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end sm:pt-0">
          <StreamKeyReissueDialog disabled={disabled} isRotating={isRotating} onRotate={onRotate} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <SecurityFieldRow
          label="스트림 URL"
          value={snapshot.streamServerUrl}
          action={
            <Button
              variant="outline"
              disabled={disabled}
              onClick={() => void onCopy(snapshot.streamServerUrl)}
            >
              <Copy />
              복사
            </Button>
          }
        />
        <SecurityFieldRow
          className="mt-3"
          label="스트림 키"
          value={isStreamKeyVisible ? snapshot.streamKey : maskSensitiveValue(snapshot.streamKey)}
          action={
            <SecurityActionGroup
              tokenKind="stream_key"
              isVisible={isStreamKeyVisible}
              disabled={disabled}
              onToggleVisible={onToggleVisible}
              onCopy={() => onCopy(snapshot.streamKey)}
            />
          }
        />
      </CardContent>
    </Card>
  );
}
